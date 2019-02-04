import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { Linq, delay, AsyncLinq } from '../src';


describe('Async Linq', () => {

    function async<T>(...col: T[]): AsyncLinq<T> {
        async function* _generator(): AsyncIterable<T> {
            for (const k of col) {
                await delay(1);
                yield k;
            }
        }
        return new AsyncLinq<T>(_generator());
    }

    it('select many', async () => {
        const ret = await async([1, 2], [3, 4])
            .selectMany(x => x)
            .toArray();
        expect(ret).to.deep.equal([1, 2, 3, 4]);
    });

    it('select', async () => {
        const ret = await async({a: 1}, {a: 2})
            .map(x => x.a)
            .toArray();
        expect(ret).to.deep.equal([1, 2]);
    })

    it('first', async () => {
        const ret = await async({a: 1}, {a: 2})
            .first()
        expect(ret).to.deep.equal({a: 1});
    });

    it('count', async () => {
        const ret = await async({a: 1}, {a: 2})
            .count();
        expect(ret).to.deep.equal(2);
    });
    
    it('filter', async () => {
        const ret = await async({a: 1}, {a: 2}, {a: 3})
            .filter(x => x.a >= 2)
            .map(x => x.a)
            .toArray();
        expect(ret).to.deep.equal([2, 3]);
    })

    
    it('concat async', async () => {
        const ret = await async({a: 1}, {a: 2}, {a: 3})
            .concat(async({a: 4}))
            .filter(x => x.a >= 2)
            .map(x => x.a)
            .toArray();
        expect(ret).to.deep.equal([2, 3, 4]);
    })

    it('concat sync', async () => {
        const ret = await async({a: 1}, {a: 2}, {a: 3})
            .concat([{a: 4}])
            .filter(x => x.a >= 2)
            .map(x => x.a)
            .toArray();
        expect(ret).to.deep.equal([2, 3, 4]);
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