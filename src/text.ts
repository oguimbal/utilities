
import { remove } from 'diacritics';
import levenshtein from 'js-levenshtein';


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

function* fetchTerms(value: any): IterableIterator<string> {
    if (!value)
        return;
    if (typeof value === 'string') {
        yield remove(value.toLowerCase());
        return;
    }
    if (typeof value !== 'object')
        return;
    for (const k of Object.keys(value)) {
        for (const f of fetchTerms(value[k]))
            yield f;
    }
}


/** Finds/suggests an item based on all text properties in the given collection */
export class TreeFinder<T> {
    private items: {
        terms: string[];
        item: T;
    }[];

    constructor(items: T[], useLevenstein: boolean) {
        this.items = items.map(x => ({
            terms: Array.from(fetchTerms(x)),
            item: x,
        }))
    }

    search(txt: string) {
        if (!txt) {
            return this.items.slice(0, 10).map(x => x.item);
        }
        const results = Array.from(this._search(txt));
        results.sort((a, b) => b.score - a.score);
        return results.map(x => x.item);
    }

    private *_search(search: string): IterableIterator<{score: number, item: T}> {
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
            if (txt.length < 40 && Math.abs(txt.length - search.length) < 10) // do not perform levenstein on large strings (it is a n^2 algorithm)
                return 1000 - levenshtein(search, txt);
            return 0;
        };

        for (const k of this.items) {
            const s = k.terms.map(score).reduce((a, b) => a + b, 0);
            yield {item: k.item, score: s};
        }
    }
}