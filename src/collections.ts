import { stringify } from 'querystring';
import { Ctor } from './types';

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
export function *unwrapIterable<T>(iterable: Iterable<Iterable<T>>): Iterable<T> {
    for (const o of iterable) {
        for (const i of o) {
            yield i;
        }
    }
}


export class Linq<T> implements Iterable<T> {
    [Symbol.iterator]: () => Iterator<T>;

    constructor(_subject: Iterable<T>) {
        _subject = _subject || [];
        this[Symbol.iterator] = _subject[Symbol.iterator].bind(_subject);
    }

    take(length: number): Linq<T> {
        const _this = this;
        return new Linq({
            [Symbol.iterator]: function*() {
                let cnt = length;
                const iterator = _this[Symbol.iterator]();
                while (cnt-- > 0) {
                    const {done, value} = iterator.next();
                    if (done)
                        break;
                    yield value;
                }
            }
        });
    }

    skip(length: number): Linq<T> {
        const _this = this;
        return new Linq({
            [Symbol.iterator]: function*() {
                let cnt = length;
                const iterator = _this[Symbol.iterator]();
                while (true) {
                    const {done, value} = iterator.next();
                    if (done)
                        break;
                    if (cnt-- > 0)
                        continue;
                    yield value;
                }
            }
        });
    }

    zip<Other>(other: Iterable<Other>): Linq<[T, Other]> {
        const _this = this;
        return new Linq<[T, Other]>({
            [Symbol.iterator]: function*() {
                const a = _this[Symbol.iterator]();
                const b = other[Symbol.iterator]();
                while (true) {
                    const aRes = a.next();
                    if (aRes.done)
                        break;
                    const bRes = b.next();
                    if (bRes.done)
                        break;
                    yield [aRes.value, bRes.value];
                }
            }
        });
    }

    count(limit?: number): number {
        const iterator = this[Symbol.iterator]();
        limit = IT_LIMIT;
        let cnt = 0;
        while (true) {
            if (iterator.next().done)
                break;
            if (cnt ++ > limit)
                return;
        }
        return cnt;
    }

    first(): T {
        const iterator = this[Symbol.iterator]();
        const {done, value} = iterator.next();
        if (done)
            throw new Error('Set is empty');
        return value;
    }

    firstOrDefault(): T {
        const iterator = this[Symbol.iterator]();
        const {value} = iterator.next();
        return value;
    }

    map<TRet>(map: (item: T, index?: number) => TRet): Linq<TRet> {
        const _this = this;
        return new Linq({
            [Symbol.iterator]: function*() {
                let i = 0;
                for (const k of _this) {
                    yield map(k, i);
                    i ++;
                }
            }
        });
    }

    filter(where: (item: T, index?: number) => boolean): Linq<T> {
        const _this = this;
        return new Linq({
            [Symbol.iterator]: function*() {
                let i = 0;
                for (const k of _this) {
                    if (where(k, i))
                        yield k;
                    i ++;
                }
            }
        });
    }

    instancesOf<SubType extends T>(ctor: Ctor<SubType>): Linq<SubType> {
        const _this = this;
        return new Linq({
            [Symbol.iterator]: function*() {
                for (const k of _this) {
                    if (k instanceof ctor)
                        yield k;
                }
            }
        });
    }

    selectMany<TRet>(selector: (item: T) => Iterable<TRet>): Linq<TRet> {
        const _this = this;
        return new Linq({
            [Symbol.iterator]: function*() {
                for (const o of _this) {
                    for (const i of (selector(o) || [])) {
                        yield i;
                    }
                }
            }
        });
    }

    notDefault(): Linq<T> {
        return this.filter(x => !!x);
    }

    toDictionary(groupOn: (item: T) => string, onCollision?: (a: T, b: T, key?: string) => T) {
        return this.toDictionarySelect(groupOn, x => x, onCollision);
    }

    toDictionarySelect<TRet>(groupOn: (item: T) => string, select: ((elt: T) => TRet), onCollision?: (a: TRet, b: TRet, key?: string) => TRet): {[key: string]: TRet} {
        const ret: {[key: string]: TRet} = {};
        let i = 0;
        for (const e of this) {
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
        for (const e of this) {
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
            return Array.from(this);
        let i = 0;
        const ret: T[] = [];
        for (const e of this) {
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
        for (const e of this) {
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
// tslint:disable-next-line: no-use-before-declare
        return new AsyncLinq({
            [Symbol.asyncIterator]:  async function* () {
                for (const i of _this)
                    yield i;
            }
        });
    }


    concat<TOther>(other: Iterable<TOther>): Linq<T | TOther> {
        if (!other)
            return this;
        const _this = this;
// tslint:disable-next-line: no-use-before-declare
        return new Linq<T | TOther>({
            [Symbol.iterator]:  function* () {
                for (const t of _this)
                    yield t;
                for (const t of other)
                    yield t;
            }
        });
    }

    unique(onMember?: (item: T) => any): Linq<T> {

        const _this = this;
        onMember = onMember || (x => x);
// tslint:disable-next-line: no-use-before-declare
        return new Linq({
            [Symbol.iterator]: function* () {
                const map = new Set();
                for (const i of _this) {
                    const comp = onMember(i);
                    if (map.has(comp))
                        continue;
                    map.add(comp);
                    yield i;
                }
            }
        });
    }

    reduce<TAcc>(accumulator: (current: TAcc, value: T) => TAcc, initial?: TAcc): TAcc {
        for (const v of this) {
            initial = accumulator(initial, v);
        }
        return initial;
    }

    sum(selector: ((item: T) => number) = (x => <any>x)): number {
        return this.reduce((s, x) => selector(x) + s, 0);
    }

    avg(selector: ((item: T) => number) = (x => <any>x)): number {
        let len = 0;
        const val = this.reduce((s, x) => {
            len++;
            return selector(x) + s;
        }, 0);
        if (!len)
            return 0;
        return val / len;
    }
}




const LIMIT = 100000;
export class AsyncLinq<T> implements AsyncIterable<T> {
    [Symbol.asyncIterator]: () => AsyncIterator<T>;

    constructor(_subject: AsyncIterable<T> | Iterable<T>) {
        if (_subject) {
            if (!_subject[Symbol.asyncIterator])
                _subject = new Linq(<Iterable<T>>_subject).toAsync();
            this[Symbol.asyncIterator] = _subject[Symbol.asyncIterator].bind(_subject);
        }
        else
            this[Symbol.asyncIterator] = (async function*(){});
    }

    take(length: number): AsyncLinq<T> {
        const _this = this;
        return new AsyncLinq({
            [Symbol.asyncIterator]: async function*() {
                let cnt = length;
                const iterator = _this[Symbol.asyncIterator]();
                while (cnt-- > 0) {
                    const {done, value} = await iterator.next();
                    if (done)
                        break;
                    yield value;
                }
            }
        });
    }

    skip(length: number): AsyncLinq<T> {
        const _this = this;
        return new AsyncLinq({
            [Symbol.asyncIterator]: async function*() {
                let cnt = length;
                const iterator = _this[Symbol.asyncIterator]();
                while (true) {
                    const {done, value} = await iterator.next();
                    if (done)
                        break;
                    if (cnt-- > 0)
                        continue;
                    yield value;
                }
            }
        });
    }



    zip<Other>(other: Iterable<Other>): AsyncLinq<[T, Other]> {
        const _this = this;
        return new AsyncLinq<[T, Other]>({
            [Symbol.asyncIterator]: async function*() {
                const a = _this[Symbol.asyncIterator]();
                const b = other[Symbol.asyncIterator]();
                while (true) {
                    const aRes = await a.next();
                    if (aRes.done)
                        break;
                    const bRes = await b.next();
                    if (bRes.done)
                        break;
                    yield [aRes.value, bRes.value];
                }
            }
        });
    }

    async count(limit?: number): Promise<number> {
        const iterator = this[Symbol.asyncIterator]();
        limit = IT_LIMIT;
        let cnt = 0;
        while (true) {
            if ((await iterator.next()).done)
                break;
            cnt ++;
        }
        return cnt;
    }

    async first(): Promise<T> {
        const iterator = this[Symbol.asyncIterator]();
        const {done, value} = await iterator.next();
        if (done)
            throw new Error('Set is empty');
        return value;
    }

    async firstOrDefault(): Promise<T> {
        const iterator = this[Symbol.asyncIterator]();
        const {value} = await iterator.next();
        return value;
    }

    map<TRet>(map: (item: T, index?: number) => TRet | Promise<TRet>): AsyncLinq<TRet> {
        const _this = this;
        return new AsyncLinq({
            [Symbol.asyncIterator]: async function*() {
                let i = 0;
                for await(const k of _this) {
                    yield await map(k, i);
                    i ++;
                }
            }
        });
    }

    filter(where: (item: T, index?: number) => (boolean | Promise<boolean>)): AsyncLinq<T> {
        const _this = this;
        return new AsyncLinq({
            [Symbol.asyncIterator]: async function*() {
                let i = 0;
                for await(const k of _this) {
                    if (await where(k, i))
                        yield k;
                    i ++;
                }
            }
        });
    }

    instancesOf<SubType extends T>(ctor: Ctor<SubType>): AsyncLinq<SubType> {
        const _this = this;
        return new AsyncLinq({
            [Symbol.asyncIterator]: async function*() {
                for await(const k of _this) {
                    if (k instanceof ctor)
                        yield k;
                }
            }
        });
    }

    selectMany<TRet>(select: (item: T) => Iterable<TRet> | Promise<Iterable<TRet>>): AsyncLinq<TRet> {
        const _this = this;
        return new AsyncLinq({
            [Symbol.asyncIterator]:  async function* () {
                for await(const o of _this) {
                    for (const i of await (select(o) || [])) {
                        yield i;
                    }
                }
            }
        });
    }

    notDefault(): AsyncLinq<T> {
        return this.filter(x => !!x);
    }

    toDictionary(groupOn: (item: T) => string, onCollision?: (a: T, b: T, key?: string) => T) {
        return this.toDictionarySelect(groupOn, x => x, onCollision);
    }

    async toDictionarySelect<TRet>(groupOn: (item: T) => (string | Promise<string>), select: ((elt: T) => TRet), onCollision?: (a: TRet, b: TRet, key?: string) => TRet): Promise<{[key: string]: TRet}> {
        const ret: {[key: string]: TRet} = {};
        let i = 0;
        for await(const e of this) {
            const key = await groupOn(e);
            if (i++ > IT_LIMIT)
                throw new Error('Capacity error');
            if (ret[key]) {
                if (!onCollision)
                    throw new Error('Duplicate key: ' + key);
                ret[key] = await onCollision(ret[key], select(e), key);
            } else
                ret[key] = await select(e);
        }
        return ret;
    }

    toMap<TKey>(groupOn: (item: T) => TKey, onCollision?: (a: T, b: T, key?: TKey) => T) {
        return this.toMapSelect(groupOn, x => x, onCollision);
    }

    async toMapSelect<TKey, TRet>(groupOn: (item: T) => (TKey | Promise<TKey>), select: ((elt: T) => TRet), onCollision?: (a: TRet, b: TRet, key?: TKey) => TRet): Promise<Map<TKey, TRet>> {
        const ret = new Map<TKey, TRet>();
        let i = 0;
        for await(const e of this) {
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
        for await(const e of this) {
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
        for await(const e of this) {
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


    concat<TOther>(other: Iterable<TOther> | AsyncIterable<TOther>) {
        if (!other)
            return this;
        const _this = this;
        return new AsyncLinq({
            [Symbol.asyncIterator]: async function*() {
                for await(const t of _this)
                    yield t;
                for await (const t of other)
                    yield t;
            }
        });
    }


    unique(onMember?: (item: T) => any): AsyncLinq<T> {
        const _this = this;
        onMember = onMember || (x => x);
// tslint:disable-next-line: no-use-before-declare
        return new AsyncLinq({
            [Symbol.asyncIterator]:  async function* () {
                const map = new Set();
                for await (const i of _this) {
                    const comp = onMember(i);
                    if (map.has(comp))
                        continue;
                    map.add(comp);
                    yield i;
                }
            }
        });
    }

    async reduce<TAcc>(accumulator: (current: TAcc, value: T) => TAcc | Promise<TAcc>, initial?: TAcc): Promise<TAcc> {
        for await (const v of this) {
            initial = await accumulator(initial, v);
        }
        return initial;
    }

    async sum(selector: ((item: T) => number) = (x => <any>x)): Promise<number> {
        return this.reduce((s, x) => selector(x) + s, 0);
    }

    async avg(selector: ((item: T) => number) = (x => <any>x)): Promise<number> {
        let len = 0;
        const val = await this.reduce((s, x) => {
            len++;
            return selector(x) + s;
        }, 0);
        if (!len)
            return 0;
        return val / len;
    }
}