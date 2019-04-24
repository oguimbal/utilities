import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { lruCache } from '../src/expirable';
import { delay } from '../src';


describe('cache', () => {

    it('trims elements', () => {
        
        const cache = lruCache<number>(3);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);
        cache.set('d', 4);

        expect([...cache.keys()].sort()).to.deep.equal(['b', 'c', 'd']);
    });

    
    it('can build element', async () => {
        
        const cache = lruCache<number>(3, x => JSON.parse(x));

        const value = await cache.get('42');
        expect(value).to.equal(42);

        expect([...cache.keys()].sort()).to.deep.equal(['42']);
    });

    it ('respects TTL', async () => {
        
        const cache = lruCache<number>(3);
        cache.set('a', 1, { ttl: 50 });
        expect(cache.get('a')).to.equal(1);

        await delay(100);

        expect(cache.get('a')).to.equal(undefined);

    })
});