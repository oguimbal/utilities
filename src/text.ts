
import { remove } from 'diacritics';
import levenshtein from 'js-levenshtein';
import { toDictionary, Linq } from './collections';


// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}



export function camelize(str: string) {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
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

function* fetchTerms(value: any, options: TreeFinderOptions<any>): IterableIterator<string> {
    if (!value)
        return;
    if (typeof value === 'string') {
        yield remove(value.toLowerCase());
        return;
    }
    if (typeof value !== 'object')
        return;
    for (const k of Object.keys(value)) {
        if (options.onlyProperties && !options.onlyProperties.has(k))
            continue;
        if (options.ignoreProperties && options.ignoreProperties.has(k))
            continue;
        for (const f of fetchTerms(value[k], options))
            yield f;
    }
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
}

/** Finds/suggests an item based on all text properties in the given collection */
export class TreeFinder<T> {
    private items: TreeItem<T>[];
    private itemsById: {[key: string]: TreeItem<T>};

    constructor(items: T[], private options?: TreeFinderOptions<T>) {
        this.options = options || {};
        this.items = items.map(x => ({
            terms: Array.from(fetchTerms(x, this.options)),
            item: x,
        }));
        if (this.options.fetchId) {
            this.itemsById = toDictionary(this.items, x => this.options.fetchId(x.item));
        }
    }

    all(): Iterable<T> {
        return new Linq(this.items).map(x => x.item);
    }

    update(item: T) {
        if (!this.options.fetchId)
            throw new Error('You must have provided a "fetchId" function to use udpate');
        const id = this.options.fetchId(item);
        const exist = this.itemsById[id];
        const terms = Array.from(fetchTerms(item, this.options));
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

    private *_search(search: string, predicate?: (item: T) => boolean): IterableIterator<{score: number, item: T}> {
        search = remove(search.toLowerCase());
        const searchBoundary = new RegExp('\\b' + escapeRegExp(search));
        const searchBoundaries = new RegExp('\\b' + escapeRegExp(search) + '\\b');
        const score = (txt: string) => {
            const foundAt = searchBoundary.exec(txt);
            if (foundAt) {
                const base = searchBoundaries.test(txt) ? 4000 : 3000;
                return base - foundAt.index;
            }
            const i = txt.indexOf(search);
            if (i >= 0)
                return 2000 - i;
            if (!this.options.noLevenstein && txt.length < 40 && Math.abs(txt.length - search.length) < 10) // do not perform levenstein on large strings (it is a n^2 algorithm)
                return 1000 - levenshtein(search, txt);
            return 0;
        };

        for (const k of this.items) {
            if (predicate && !predicate(k.item))
                continue;
            const s = k.terms.map(score).reduce((a, b) => a + b, 0);
            yield {item: k.item, score: s};
        }
    }
}