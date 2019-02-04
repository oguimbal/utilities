
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

export function toDictionarySelect<T, TRet>(array: T[], groupOn: (elt: T) => string, select: ((elt: T) => TRet)) {
    const ret: {[key: string]: TRet} = {};
    for (const e of array) {
        const key = groupOn(e);
        if (ret[key])
            throw new Error('Duplicate key: ' + key)
        ret[key] = select(e);
    }
    return ret;
}


export function toLookup<T>(array: T[], groupOn: (elt: T) => string) {
    const ret: {[key: string]: T[]} = {};
    for (const e of array) {
        const key = groupOn(e);
        if (ret[key])
            ret[key].push(e)
        else
            ret[key] = [e];
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

export const Iterable = {
    *take<T>(iterable: Iterable<T>, length: number): IterableIterator<T> {
        const iterator = iterable[Symbol.iterator]();
        while (length-- > 0) {
            const {done, value} = iterator.next();
            if (done)
                break;
            yield value;
        }
    },
    count<T>(iterable: Iterable<T>, limit?: number): number {
        const iterator = iterable[Symbol.iterator]();
        limit = 99999;
        let cnt = 0;
        while (true) {
            if (iterator.next().done)
                break;
            cnt ++;
        }
        return cnt;
    },
    first<T>(iterable: Iterable<T>): T {
        const iterator = iterable[Symbol.iterator]();
        const {done, value} = iterator.next();
        if (done)
            throw new Error('Set is empty');
        return value;
    },
    
    firstOrDefault<T>(iterable: Iterable<T>): T {
        const iterator = iterable[Symbol.iterator]();
        const {value} = iterator.next();
        return value;
    },
    *map<T, TRet>(iterable: Iterable<T>, map: (item: T, index?: number) => TRet): Iterable<TRet> {
        let i = 0;
        for (const k of iterable) {
            yield map(k, i);
            i ++;
        }
    },
    *filter<T>(iterable: Iterable<T>, where: (item: T, index?: number) => boolean): Iterable<T> {
        let i = 0;
        for (const k of iterable) {
            if (where(k, i))
                yield k;
            i ++;
        }
    },
    *unwrap<T>(iterable: Iterable<Iterable<T>>): Iterable<T> {
        for (const o of iterable) {
            for (const i of o) {
                yield i;
            }
        }
    },
    *selectMany<T, TRet>(iterable: Iterable<T>, select: (item: T) => Iterable<TRet>): Iterable<TRet> {
        for (const o of iterable) {
            for (const i of select(o)) {
                yield i;
            }
        }
    },
    *notNull<T>(iterable: Iterable<T>): Iterable<T> {

    }
}

export class Linq<T> implements Iterable<T> {
    [Symbol.iterator]: () => Iterator<T>;

    constructor(private subject: Iterable<T>) {
        this[Symbol.iterator] = subject[Symbol.iterator].bind(subject);
    }
    
    take(length: number): Linq<T> {
        return new Linq(Iterable.take(this.subject, length));
    }

    count(limit?: number): number {
        return Iterable.count(this.subject, limit);
    }

    first(): T {
        return Iterable.first(this.subject);
    }
    
    firstOrDefault(): T {
        return Iterable.firstOrDefault(this.subject);
    }

    map<TRet>(map: (item: T, index?: number) => TRet): Linq<TRet> {
        return new Linq(Iterable.map(this.subject, map));
    }

    filter(where: (item: T, index?: number) => boolean): Linq<T> {
        return new Linq(Iterable.filter(this.subject, where));
    }

    selectMany<TRet>(selector: (item: T) => TRet[]): Linq<TRet> {
        return new Linq(Iterable.selectMany(this.subject, selector));
    }

    notDefault(iterable: Iterable<T>): Linq<T> {
        return new Linq(Iterable.filter(this.subject, x => !x));
    }
}