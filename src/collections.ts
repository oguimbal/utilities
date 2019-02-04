import { stringify } from 'querystring';

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
const IT_LIMIT = 100000;
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
    async *takeAsync<T>(iterable: AsyncIterable<T>, length: number): AsyncIterableIterator<T> {
        const iterator = iterable[Symbol.asyncIterator]();
        while (length-- > 0) {
            const {done, value} = await iterator.next();
            if (done)
                break;
            yield value;
        }
    },
    count<T>(iterable: Iterable<T>, limit?: number): number {
        const iterator = iterable[Symbol.iterator]();
        limit = IT_LIMIT;
        let cnt = 0;
        while (true) {
            if (iterator.next().done)
                break;
            cnt ++;
        }
        return cnt;
    },
    async countAsync<T>(iterable: AsyncIterable<T>, limit?: number): Promise<number> {
        const iterator = iterable[Symbol.asyncIterator]();
        limit = IT_LIMIT;
        let cnt = 0;
        while (true) {
            if ((await iterator.next()).done)
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
    async firstAsync<T>(iterable: AsyncIterable<T>): Promise<T> {
        const iterator = iterable[Symbol.asyncIterator]();
        const {done, value} = await iterator.next();
        if (done)
            throw new Error('Set is empty');
        return value;
    },
    
    firstOrDefault<T>(iterable: Iterable<T>): T {
        const iterator = iterable[Symbol.iterator]();
        const {value} = iterator.next();
        return value;
    },
    
    async firstOrDefaultAsync<T>(iterable: AsyncIterable<T>): Promise<T> {
        const iterator = iterable[Symbol.asyncIterator]();
        const {value} = await iterator.next();
        return value;
    },
    
    *map<T, TRet>(iterable: Iterable<T>, map: (item: T, index?: number) => TRet): Iterable<TRet> {
        let i = 0;
        for (const k of iterable) {
            yield map(k, i);
            i ++;
        }
    },
    async *mapAsync<T, TRet>(iterable: AsyncIterable<T>, map: (item: T, index?: number) => (TRet | Promise<TRet>)): AsyncIterable<TRet> {
        let i = 0;
        for await(const k of iterable) {
            yield await map(k, i);
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
    async *filterAsync<T>(iterable: AsyncIterable<T>, where: (item: T, index?: number) => (boolean | Promise<boolean>)): AsyncIterable<T> {
        let i = 0;
        for await(const k of iterable) {
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
    async *selectManyAsync<T, TRet>(iterable: AsyncIterable<T>, select: (item: T) => Iterable<TRet>): AsyncIterable<TRet> {
        for await(const o of iterable) {
            for (const i of select(o)) {
                yield i;
            }
        }
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
        return Iterable.count(this.subject, limit > 0 ? limit : IT_LIMIT);
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

    notDefault(): Linq<T> {
        return new Linq(Iterable.filter(this.subject, x => !x));
    }

    toDictionary(groupOn: (item: T) => string, onCollision?: (a: T, b: T, key?: string) => T) {
        return this.toDictionarySelect(groupOn, x => x, onCollision);
    }
    
    toDictionarySelect<TRet>(groupOn: (item: T) => string, select: ((elt: T) => TRet), onCollision?: (a: TRet, b: TRet, key?: string) => TRet): {[key: string]: TRet} {
        const ret: {[key: string]: TRet} = {};
        let i = 0;
        for (const e of this.subject) {
            const key = groupOn(e);
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            if (ret[key]) {
                if (!onCollision)
                    throw new Error('Duplicate key: ' + key);
                ret[key] = onCollision(ret[key], select(e), key);
            } else
                ret[key] = select(e);
        }
        return ret;
    }

    toMap<TKey>(groupOn: (item: T) => TKey, onCollision?: (a: T, b: T, key?: TKey) => T): Map<TKey, T> {
        return this.toMapSelect(groupOn, x => x, onCollision);
    }
    
    toMapSelect<TKey, TRet>(groupOn: (item: T) => TKey, select: ((elt: T) => TRet), onCollision?: (a: TRet, b: TRet, key?: TKey) => TRet): Map<TKey, TRet> {
        const ret = new Map<TKey, TRet>();
        let i = 0;
        for (const e of this.subject) {
            const key = groupOn(e);
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            if (ret.has(key)) {
                if (!onCollision)
                    throw new Error('Duplicate key: ' + key);
                ret.set(key, onCollision(ret.get(key), select(e), key));
            } else
                ret.set(key, select(e));
        }
        return ret;
    }

    toArray(unsafe?: boolean): T[] {
        if (unsafe)
            return Array.from(this.subject);
        let i = 0;
        const ret: T[] = [];
        for (const e of this.subject) {
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            ret.push(e);
        }
        return ret;
    }

    toLookup<TKey>(groupOn: (elt: T) => TKey): Map<TKey, T[]> {
        return this.toLookupSelect(groupOn, x => x);
    }
    

    toLookupSelect<TKey, TRet>(groupOn: (elt: T) => TKey, select: (elt: T) => TRet): Map<TKey, TRet[]> {
        const ret = new Map<TKey, TRet[]>();
        let i = 0;
        for (const e of this.subject) {
            const key = groupOn(e);
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            if (ret.has(key))
                ret.get(key).push(select(e))
            else
                ret.set(key, [select(e)]);
        }
        return ret;
    }

    toAsync(): AsyncLinq<T> {
        const _this = this;
        async function* gen() {
            for (const i of _this.subject)
                yield i;
        }
// tslint:disable-next-line: no-use-before-declare
        return new AsyncLinq(gen());
    }
    

    concat(other: Iterable<T>) {
        const _this = this;
        function* gen() {
            for (const t of _this)
                yield t;
            for (const t of other)
                yield t;
        }
// tslint:disable-next-line: no-use-before-declare
        return new Linq(gen());
    }
}




const LIMIT = 100000;
export class AsyncLinq<T> implements AsyncIterable<T> {
    [Symbol.asyncIterator]: () => AsyncIterator<T>;

    constructor(private subject: AsyncIterable<T>) {
        this[Symbol.asyncIterator] = subject[Symbol.asyncIterator].bind(subject);
    }
    
    take(length: number): AsyncLinq<T> {
        return new AsyncLinq(Iterable.takeAsync(this.subject, length));
    }

    count(limit?: number): Promise<number> {
        return Iterable.countAsync(this.subject, limit > 0 ? limit : IT_LIMIT);
    }

    first(): Promise<T> {
        return Iterable.firstAsync(this.subject);
    }
    
    firstOrDefault(): Promise<T> {
        return Iterable.firstOrDefaultAsync(this.subject);
    }

    map<TRet>(map: (item: T, index?: number) => TRet): AsyncLinq<TRet> {
        return new AsyncLinq(Iterable.mapAsync(this.subject, map));
    }

    filter(where: (item: T, index?: number) => boolean): AsyncLinq<T> {
        return new AsyncLinq(Iterable.filterAsync(this.subject, where));
    }

    selectMany<TRet>(selector: (item: T) => TRet[]): AsyncLinq<TRet> {
        return new AsyncLinq(Iterable.selectManyAsync(this.subject, selector));
    }

    notDefault(): AsyncLinq<T> {
        return new AsyncLinq(Iterable.filterAsync(this.subject, x => !x));
    }

    toDictionary(groupOn: (item: T) => string, onCollision?: (a: T, b: T, key?: string) => T) {
        return this.toDictionarySelect(groupOn, x => x, onCollision);
    }
    
    async toDictionarySelect<TRet>(groupOn: (item: T) => (string | Promise<string>), select: ((elt: T) => TRet), onCollision?: (a: TRet, b: TRet, key?: string) => TRet): Promise<{[key: string]: TRet}> {
        const ret: {[key: string]: TRet} = {};
        let i = 0;
        for await(const e of this.subject) {
            const key = await groupOn(e);
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            if (ret[key]) {
                if (!onCollision)
                    throw new Error('Duplicate key: ' + key);
                ret[key] = onCollision(ret[key], select(e), key);
            } else
                ret[key] = select(e);
        }
        return ret;
    }

    toMap<TKey>(groupOn: (item: T) => TKey, onCollision?: (a: T, b: T, key?: TKey) => T) {
        return this.toMapSelect(groupOn, x => x, onCollision);
    }
    
    async toMapSelect<TKey, TRet>(groupOn: (item: T) => (TKey | Promise<TKey>), select: ((elt: T) => TRet), onCollision?: (a: TRet, b: TRet, key?: TKey) => TRet): Promise<Map<TKey, TRet>> {
        const ret = new Map<TKey, TRet>();
        let i = 0;
        for await(const e of this.subject) {
            const key = await groupOn(e);
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            if (ret.has(key)) {
                if (!onCollision)
                    throw new Error('Duplicate key: ' + key);
                ret.set(key, onCollision(ret.get(key), select(e), key));
            } else
                ret.set(key, select(e));
        }
        return ret;
    }

    async toArray(): Promise<T[]> {
        let i = 0;
        const ret: T[] = [];
        for await(const e of this.subject) {
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            ret.push(e);
        }
        return ret;
    }

    toLookup<TKey>(groupOn: (elt: T) => TKey) {
        return this.toLookupSelect(groupOn, x => x);
    }
    

    async toLookupSelect<TKey, TRet>(groupOn: (elt: T) => (TKey | Promise<TKey>), select: (elt: T) => TRet): Promise<Map<TKey, TRet[]>> {
        const ret = new Map<TKey, TRet[]>();
        let i = 0;
        for await(const e of this.subject) {
            const key = await groupOn(e);
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            if (ret.has(key))
                ret.get(key).push(select(e))
            else
                ret.set(key, [select(e)]);
        }
        return ret;
    }


    concat(other: Iterable<T> | AsyncIterable<T>) {
        const _this = this;
        async function* gen() {
            for await(const t of _this)
                yield t;
            for await (const t of other)
                yield t;
        }
        return new AsyncLinq(gen());
    }
}