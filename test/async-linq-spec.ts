import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { Linq, delay, AsyncLinq } from '../src';


describe('Async Linq', () => {

    
    async function* _generator<T>(col: T[]): AsyncIterable<T> {
        for (const k of col) {
            await delay(1);
            yield k;
        }
    };

    function async<T>(...col: T[]): AsyncLinq<T> {
        
        const obj: any = {};
        obj[Symbol.asyncIterator] = () => _generator(col);
        return new AsyncLinq<T>(obj);
    }


    it('select many', async () => {
        const ret = async([1, 2], [3, 4])
            .selectMany(x => x);
        expect(await ret.toArray()).to.deep.equal([1, 2, 3, 4]);
        expect(await ret.toArray()).to.deep.equal([1, 2, 3, 4]);
    });

    it('map', async () => {
        const ret = async({a: 1}, {a: 2})
            .map(x => x.a)
        expect(await ret.toArray()).to.deep.equal([1, 2]);
        expect(await ret.toArray()).to.deep.equal([1, 2]);
    })
    
    it('map async', async () => {
        const ret = async({a: 1}, {a: 2})
            .map(async x => {
                await delay(1);
                return x.a;
            })
        expect(await ret.toArray()).to.deep.equal([1, 2]);
        expect(await ret.toArray()).to.deep.equal([1, 2]);
    })

    it('first', async () => {
        const ret = async({a: 1}, {a: 2})
        expect(await ret.first()).to.deep.equal({a: 1});
        expect(await ret.first()).to.deep.equal({a: 1});
    });

    it('count', async () => {
        const ret = async({a: 1}, {a: 2});
        expect(await ret.count()).to.deep.equal(2);
        expect(await ret.count()).to.deep.equal(2);
    });
    
    it('filter', async () => {
        const ret = async({a: 1}, {a: 2}, {a: 3})
            .filter(x => x.a >= 2)
            .map(x => x.a);
        expect(await ret.toArray()).to.deep.equal([2, 3]);
        expect(await ret.toArray()).to.deep.equal([2, 3]);
    })
    
    it('filter async', async () => {
        const ret = async({a: 1}, {a: 2}, {a: 3})
            .filter(async x => {
                await delay(1);
                return x.a >= 2;
            })
            .map(x => x.a);
        expect(await ret.toArray()).to.deep.equal([2, 3]);
        expect(await ret.toArray()).to.deep.equal([2, 3]);
    })


    
    it('unique', async () => {
        const ret = async({a: 1}, {a: 2}, {a: 2}, {a: 3})
            .unique(x => x.a)
            .map(x => x.a)
        expect(await ret.toArray()).to.deep.equal([1, 2, 3]);
        expect(await ret.toArray()).to.deep.equal([1, 2, 3]);
    })

    
    it('concat async', async () => {
        const ret = async({a: 1}, {a: 2}, {a: 3})
            .concat(async({a: 4}))
            .filter(x => x.a >= 2)
            .map(x => x.a)
        expect(await ret.toArray()).to.deep.equal([2, 3, 4]);
        expect(await ret.toArray()).to.deep.equal([2, 3, 4]);
    })

    it('concat sync', async () => {
        const ret = async({a: 1}, {a: 2}, {a: 3})
            .concat([{a: 4}])
            .filter(x => x.a >= 2)
            .map(x => x.a)
            
        expect(await ret.toArray()).to.deep.equal([2, 3, 4]);
        expect(await ret.toArray()).to.deep.equal([2, 3, 4]);
    })


    it('does not start iteration automatically', async () => {
        async function* generator(): AsyncIterable<{val: number}> {
            throw new Error('Should not happen');
        }

        const val = new AsyncLinq(generator())
            .filter(x => x.val > 42);
        try {
            await val.toArray();
        } catch (e) {
            expect(e.message).to.equal('Should not happen');
            return;
        }
        expect.fail('Should have failed')
    });
});