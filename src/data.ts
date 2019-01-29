

export function copyWithFunctions(obj, removeFunctions?: boolean) {
    if (!obj)
        return obj;
    if (Array.isArray(obj)) {
        const result = [];
        obj.forEach(x => {
            if (typeof x === 'function') {
                if (!removeFunctions)
                    result.push(x);
            } else
                result.push(copyWithFunctions(x, removeFunctions));
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
                result[k] = copyWithFunctions(val, removeFunctions);
            }
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


