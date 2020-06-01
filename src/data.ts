import moment from 'moment';
import { Ctor } from './types';

export function deepCopy(obj) {
    return copyWithFunctions(obj, true);
}

export type DeepEqualityComparer<T> = (a: T, b: T, strict?: boolean) => boolean;
const deepEqualityComparers = new Map<Ctor<any>, DeepEqualityComparer<any>>();
export function addDeepEqualityComparer<T>(proto: Ctor<T>, comparer: DeepEqualityComparer<T>) {
    deepEqualityComparers.set(proto, comparer);
}

export function deepEqual<T>(a: T, b: T, strict?: boolean, depth = 10, numberDelta = 0.0001) {
    if (depth < 0) {
        console.error('Comparing too deep entities');
        return false;
    }

    if (a === b) {
        return true;
    }
    if (!strict) {
        // should not use '==' because it could call .toString() on objects when compared to strings.
        // ... which is not ok. Especially when working with translatable objects, which .toString() returns a transaltion (a string, thus)
        if (!a && !b) {
            return true;
        }
    }

    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i], strict, depth - 1, numberDelta))
                return false;
        }
        return true;
    }

    // handle dates
    if (a instanceof Date || b instanceof Date || moment.isMoment(a) || moment.isMoment(b)) {
        const am = moment(a);
        const bm = moment(b);
        if (am.isValid() !== bm.isValid())
            return false;
        return Math.abs(am.diff(bm, 'seconds')) < 0.001;
    }

    // handle durations
    if (moment.isDuration(a) || moment.isDuration(b)) {
        const da = moment.duration(a);
        const db = moment.duration(b);
        if (da.isValid() !== db.isValid())
            return false;
        return Math.abs(da.asMilliseconds() - db.asMilliseconds()) < 1;
    }

    const fa = Number.isFinite(<any>a);
    const fb = Number.isFinite(<any>b);
    if (fa || fb) {
        return fa && fb && Math.abs(<any>a - <any>b) <= numberDelta;
    }

    // handle plain objects
    if (typeof a !== 'object' || typeof a !== typeof b)
        return false;
    if (!a || !b) {
        return false;
    }

    const aproto = Object.getPrototypeOf(a);
    const bproto = Object.getPrototypeOf(a);
    if (aproto && aproto.constructor && deepEqualityComparers.has(aproto.constructor) || bproto && bproto.constructor && deepEqualityComparers.has(bproto.constructor)) {
        if (aproto.constructor !== bproto.constructor) {
            return false;
        }
        return deepEqualityComparers.get(aproto.constructor)(a, b, strict);
    }
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (strict && ak.length !== bk.length)
        return false;
    const set: Iterable<string> = strict
        ? Object.keys(a)
        : new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of set) {
        if (!deepEqual(a[k], b[k], strict, depth - 1, numberDelta))
            return false;
    }
    return true;
}


export function copyWithFunctions(obj, removeFunctions?: boolean, maxDepth = 20) {
    if (!obj)
        return obj;
    if (maxDepth < 0)
        throw new Error('Max depth reached');
    // handle known immutable types (that are typeof 'object')
    if (obj instanceof Date) {
        return obj;
    }
    if (moment.isMoment(obj)) {
        return moment(obj);
    }
    if (moment.isDuration(obj)) {
        return moment.isDuration(obj);
    }

    if (Array.isArray(obj)) {
        const result = [];
        obj.forEach(x => {
            if (typeof x === 'function') {
                if (!removeFunctions)
                    result.push(x);
            } else
                result.push(copyWithFunctions(x, removeFunctions, maxDepth - 1));
        });
        return result;
    }else if (typeof obj === 'object') {
        const result = {};
        for (const k in obj) {
            if (!(k in obj))
                continue;
            const val = obj[k];
            if (typeof val === 'function') {
                if (!removeFunctions)
                    result[k] = val;
            } else {
                result[k] = copyWithFunctions(val, removeFunctions, maxDepth - 1);
            }
        }
        for (const o of Object.getOwnPropertySymbols(obj)) {
            result[o] = obj[o];
        }
        Object.setPrototypeOf(result, Object.getPrototypeOf(obj));
        if (Object.isFrozen(obj)) {
            Object.freeze(result);
        }
        return result;
    } else {
        return obj;
    }
}
export function copyFunctions(target, source)
{
    if (Array.isArray(target)) {
        if (!Array.isArray(source))
            return target;
        let i = 0;
        for (; i < source.length && i < target.length; i++) {
            target[i] = copyFunctions(target[i], source[i]);
        }
        for (; i < source.length; i++) {
            const fnc = copyFunctions(null, source[i]);
            if (fnc)
                target.push(fnc);
        }
        return target;
    } else if (source && typeof source === 'object') {
        let hasModified = false;
        const ret = target || {};
        for (const k in source) {
            if (!(k in source))
                continue;
            const result = copyFunctions(ret[k], source[k]);
            if (result) {
                hasModified = true;
                ret[k] = result;
            }
        }
        if (!target && !hasModified)
            return null;
        return ret;
    } else if (typeof source === 'function') {
        return source;
    }else
        return target;
}


/** Copies all the properties from source to destination, and returns destination (not deep copy) */
export function copy<TDest>(source: Partial<TDest>, destination: TDest, ...onlyProperties: (keyof TDest)[]): TDest {
    for (const k in source) {
        if (!(k in source))
            continue;
        if (onlyProperties && onlyProperties.length && onlyProperties.indexOf(<any>k) < 0)
            continue;
        destination[k] = source[k];
    }
    return destination;
}


export function resetTo(objToReset, source){
    for (const o in objToReset)
        delete objToReset[o];
    for (const o in source) {
        if (!(o in source))
            continue;
        let val = source[o];
        if (typeof val === 'function')
            val = val.bind(objToReset);
        objToReset[o] = source[o];
    }
}


export function graphMatches(item: any, val: string) {
    if (!item)
        return false;
    if (!val)
        return true;
    val = val.toLowerCase();
    const m = (o: any, i: number) => {
        if (!o || i > 3)
            return false;
        if (o instanceof Array)
            return !!o.find(x => m(x, i + 1));
        switch (typeof o) {
            case 'object':
                return !!Object.keys(o).find(x => m(o[x], i + 1));
            case 'string':
                return o.toLowerCase().includes(val);
        }
        return false;
    }
    return m(item, 0);
}


/**
 * Returns a copy of 'options', augmented with 'defaults' keys that were not in options
 */
export function mergeOptions<T extends Object>(options: Partial<T>, defaults: T): T {
    const ret: T = {...<any>(options || {})};
    for (const k of Object.keys(defaults)) {
        if (k in ret)
            continue;
        ret[k] = defaults[k];
    }
    return ret;
}




/** Returns 'true' if all the properties in 'partial' are equal to the same properties on 'source' */
export function partialEqual<T>(source: T, partial: Partial<T>) {
    for (const k in partial) {
        if (!(k in partial))
            continue;
        if (source[k] !== partial[k])
            return false;
    }
    return true;
}


export function hashCode(str: string) {
    let hash = 0, i: number, chr: number;
    if (str.length === 0)
        return hash;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
// tslint:disable-next-line: no-bitwise
        hash  = ((hash << 5) - hash) + chr;
// tslint:disable-next-line: no-bitwise
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };