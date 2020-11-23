
import { remove } from 'diacritics';
import levenshtein from 'js-levenshtein';
import { toDictionary, Linq, AsyncLinq } from './collections';


// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}



export function camelize(str: string) {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
        return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
    str = str.replace(/[^a-zA-Z0-9_]+/g, '');
    return str;
}


export function levenshteinDistance(string1: string, string2: string): number {
    string1 = remove(string1.trim().toLowerCase());
    string2 = remove(string2.trim().toLowerCase());
    return levenshtein(string1, string2);
}

export function removeSpecialCharacters(str: string) {
    const rgx = new RegExp(/[^a-zA-Z0-9\s\-]/);
    return str.replace(rgx, '_');
}
const uncamel = (camelCase: string) => camelCase
    .replace(/([A-Z])/g, (match) => ` ${match.toLowerCase()}`)
    .replace(/\s+/g, ' ');

function* _fetchTerms(value: any, options: TreeFinderOptions<any>, level: number): IterableIterator<string> {
    if (!value || level < 0)
        return;
    if (typeof value === 'string') {
        yield value;
        return;
    }
    if (typeof value !== 'object')
        return;


    const direct = options.anyToText && options.anyToText(value);
    if (direct) {
        yield* direct;
        return;
    }

    if (value instanceof Array) {
        for (const v of value) {
            yield* _fetchTerms(v, options, level - 1);
        }
        return;
    }

    for (const k of Object.keys(value)) {
        if (options.onlyProperties && !options.onlyProperties.has(k))
            continue;
        if (options.ignoreProperties && options.ignoreProperties.has(k))
            continue;

        for (const f of _fetchTerms(value[k], options, level - 1))
            yield f;
    }
}

function fetchTerms(value: any, options: TreeFinderOptions<any>): string[] {
    const ret = new Linq(options.fetchText
        ? options.fetchText(value)
        : _fetchTerms(value, options, 10))
        .notDefault()
        .selectMany(function* (v: string) {
            v = remove(v);
            if (!options.noUncamel) {
                const uncamelized = uncamel(v);
                yield uncamelized.toLowerCase();
            }
            yield v.toLowerCase();
        })
        .unique()
        .filter(x => !!x)
        .toArray();
    // if sufficient long terms, then ignore shorts
    const shorts = ret.filter(x => x.length >= 3);
    return shorts.length >= 1
        ? shorts
        : ret;
}


interface TreeItem<T> {
    terms: string[];
    item: T;
}
export interface TreeFinderOptions<T> {
    readonly fetchId?: (item: T) => string;
    readonly onlyProperties?: Set<string>;
    readonly ignoreProperties?: Set<string>;
    readonly noLevenstein?: boolean;
    readonly noUncamel?: boolean;
    /** Custom text conversion of the whole object */
    readonly fetchText?: (item: T) => Iterable<string>;
    /** If provided, this will give a chance to avoid traversing an object by returning a string to analyze (will traverse object if returns null.) */
    readonly anyToText?: (value: any) => Iterable<string> | null | undefined;
}

/** Finds/suggests an item based on all text properties in the given collection */
export class TreeFinder<T> {
    private items: TreeItem<T>[];
    private itemsById: { [key: string]: TreeItem<T> };

    constructor(items: T[], private options?: TreeFinderOptions<T>) {
        this.options = options || {};
        this.items = items.map(x => ({
            terms: fetchTerms(x, this.options),
            item: x,
        }));
        if (this.options.fetchId) {
            this.itemsById = toDictionary(this.items, x => this.options.fetchId(x.item));
        }
    }

    all(): Iterable<T> {
        return new Linq(this.items).map(x => x.item);
    }

    byId(id: string): T {
        if (!this.options.fetchId)
            throw new Error('You must have provided a "fetchId" function to use udpate');
        const ret = this.itemsById[id];
        return ret && ret.item;
    }

    update(item: T) {
        if (!this.options.fetchId)
            throw new Error('You must have provided a "fetchId" function to use udpate');
        const id = this.options.fetchId(item);
        const exist = this.itemsById[id];
        const terms = fetchTerms(item, this.options);
        if (!exist) {
            // add
            this.items.push({
                terms,
                item,
            });
            return;
        }
        // update
        exist.terms = terms;
        exist.item = item;
    }

    delete(item: T | string) {
        if (!this.options.fetchId)
            throw new Error('You must have provided a "fetchId" function to use delete');
        if (typeof item !== 'string')
            item = this.options.fetchId(item);

        const exist = this.itemsById[item];
        if (!exist)
            return;
        delete this.itemsById[item];
        const i = this.items.indexOf(exist);
        if (i >= 0)
            this.items.splice(i, 1);
    }

    search(txt: string, predicate?: (item: T) => boolean): Iterable<T> {
        if (!txt) {
            let ret = new Linq(this.items)
                .map(x => x.item);
            if (predicate)
                ret = ret.filter(predicate);
            return ret;
        }
        const results = Array.from(this._search(txt, predicate));
        results.sort((a, b) => b.score - a.score);
        return results.map(x => x.item);
    }

    private *_search(search: string, predicate?: (item: T) => boolean): IterableIterator<{ score: number, item: T }> {
        const forceYielded = new Set<T>();
        if (this.itemsById && search in this.itemsById) {
            const item = this.itemsById[search].item;
            yield { score: 100001, item };
            forceYielded.add(item);
        }
        search = remove(search.toLowerCase());
        if (this.itemsById && search in this.itemsById) {
            const item = this.itemsById[search].item;
            if (!forceYielded.has(item)) {
                yield { score: 100000, item };
                forceYielded.add(item);
            }
        }
        const searchBoundary = new RegExp('\\b' + escapeRegExp(search));
        const searchBoundaries = new RegExp('\\b' + escapeRegExp(search) + '\\b');
        const score = (txt: string) => {
            if (txt === search) {
                return txt.length > 3
                    ? (10000 + txt.length)
                    : (5000 + txt.length);
            }
            const foundAt = searchBoundary.exec(txt);
            if (foundAt) {
                const base = searchBoundaries.test(txt) ? 4000 : 3000;
                return base - foundAt.index;
            }
            const i = txt.indexOf(search);
            if (i >= 0)
                return 2000 - i;
            // do not perform levenstein on large strings (it is a n^2 algorithm)
            if (!this.options.noLevenstein && txt.length < 20 && Math.abs(txt.length - search.length) < 5) {
                const lev = levenshtein(search, txt);
                if (lev <= search.length / 2)
                    return 1000 - lev;
            }
            return 0;
        };

        for (const k of this.items) {
            if (forceYielded.has(k.item))
                continue;
            if (predicate && !predicate(k.item))
                continue;
            const nZero = k.terms.map(score)
                .filter(x => x > 0);
            if (!nZero.length)
                continue;
            const s = nZero
                .reduce((a, b) => a + b, 0) / nZero.length;
            yield { item: k.item, score: s };
        }
    }
}