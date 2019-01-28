
export function groupBy<T>(array: T[], groupOn: (elt: T) => string) {
    const ret: {[key: string]: T[]} = {};
    for (const e of array) {
        const key = groupOn(e);
        let arr = ret[key];
        if (!arr)
            ret[key] = arr = [];
        arr.push(e);
    }
    return ret;
}

export function toDictionary<T>(array: T[], groupOn: (elt: T) => string) {
    const ret: {[key: string]: T} = {};
    for (const e of array) {
        const key = groupOn(e);
        if (ret[key])
            throw new Error('Duplicate key: ' + key)
        ret[key] = e;
    }
    return ret;
}


export function unique<T>(array: T[], compareOn: ((elt: T) => any) = x => x): T[] {
    const has: any = {};
    return array.filter(x => {
        const key = compareOn(x);
        if (has[key])
            return false;
        has[key] = true;
        return true;
    })
}

export type PropGetter<T> = string  | ((item: T) => string | number);
export function sortBy<T>(data: T[], get: PropGetter<T>, desc?: boolean) {
    let fn: (item: T) => string | number;
    if (typeof get === 'string') {
        const cpy = get;
        fn = x => x[cpy];
    } else
        fn = get;
    return data.sort((a, b) => {
        const ap = fn(a);
        const bp = fn(b);
        if (desc)
            return ap < bp ? 1 : -1;
        return ap > bp ? 1 : -1;
    })
}
export function range(start = 0, end = 0, step = 1) {
    if (start === end || step === 0) {
        return [];
    }

    const diff = Math.abs(end - start);
    const length = Math.ceil(diff / step);

    return start > end
        ? Array.from({length}, (value, key) => start - key * step)
        : Array.from({length}, (value, key) => start + key * step);

}