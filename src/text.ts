
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
    const rgx = new RegExp(/[^a-zA-Z0-9 -]/);
    return str.replace(rgx, '_');  
}

