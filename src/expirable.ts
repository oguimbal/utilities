import _Cache from 'caching-map';

// https://github.com/broadly/caching-map#readme

interface ICacheFn {
    <T = any>(maxElements: number): ICache<T>;
    <T = any>(maxElements: number, materialize: Materializer<T>): IAsyncCache<T>;
}

export type Materializer<T> =  (elt: string) => T | Promise<T>;

export interface ICacheOptions {
    ttl?: number;
    cost?: number;
}

export interface ICacheBase<T> {
    readonly size: number;
    readonly cost: number;
    has(key: string): boolean;
    delete(key: string): void;
    keys(): IterableIterator<string>;
}
export interface ICache<T> extends ICacheBase<T> {
    get(key: string): T;
    set(key: string, value: T, options?: ICacheOptions): void;
}


export interface IAsyncCache<T> extends ICacheBase<T> {
    materialize: Materializer<T>;
    get(key: string): Promise<T>;
}


export const lruCache: ICacheFn = function(limit: number, materializer?: Materializer<any>) {

    if (!limit)
        limit = Infinity;
    const ret = new _Cache(limit);
    if (materializer)
        ret.materialize = materializer;
    return ret;
};