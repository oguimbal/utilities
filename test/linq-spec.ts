import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { Linq } from '../src';


describe('Linq', () => {

    it('select many', () => {
        const ret = Array.from(new Linq([[1, 2], [3, 4]])
            .selectMany(x => x));
        expect(ret).to.deep.equal([1, 2, 3, 4]);
    });

    it('select', () => {
        const ret = Array.from(new Linq([{a: 1}, {a: 2}])
            .map(x => x.a));
        expect(ret).to.deep.equal([1, 2]);
    })

    it('first', () => {
        const ret = new Linq([{a: 1}, {a: 2}])
            .first();
        expect(ret).to.deep.equal({a: 1});
    });

    it('count', () => {
        const ret = new Linq([{a: 1}, {a: 2}])
            .count();
        expect(ret).to.deep.equal(2);
    });
    
    it('filter', () => {
        const ret = Array.from(new Linq([{a: 1}, {a: 2}, {a: 3}])
            .filter(x => x.a >= 2))
            .map(x => x.a)
        expect(ret).to.deep.equal([2, 3]);
    })
});