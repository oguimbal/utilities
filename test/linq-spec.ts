import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { Linq } from '../src';


describe('Linq', () => {

    it('can run twice', () => {
        const ret = new Linq([[1, 2], [3, 4]])
            .selectMany(x => x);
        expect(ret.toArray()).to.deep.equal([1, 2, 3, 4]);
        expect(ret.toArray()).to.deep.equal([1, 2, 3, 4]);
    });

    it('select many', () => {
        const ret = new Linq([[1, 2], [3, 4]])
            .selectMany(x => x);
        expect(ret.toArray()).to.deep.equal([1, 2, 3, 4]);
        expect(ret.toArray()).to.deep.equal([1, 2, 3, 4]);
    });

    it('select', () => {
        const ret = new Linq([{a: 1}, {a: 2}])
            .map(x => x.a);
        expect(ret.toArray()).to.deep.equal([1, 2]);
        expect(ret.toArray()).to.deep.equal([1, 2]);
    })

    it('first', () => {
        const ret = new Linq([{a: 1}, {a: 2}])
        expect(ret.first()).to.deep.equal({a: 1});
        expect(ret.first()).to.deep.equal({a: 1});
    });

    it('count', () => {
        const ret = new Linq([{a: 1}, {a: 2}])
        expect(ret.count()).to.deep.equal(2);
        expect(ret.count()).to.deep.equal(2);
    });
    
    it('filter', () => {
        const ret = new Linq([{a: 1}, {a: 2}, {a: 3}])
            .filter(x => x.a >= 2)
            .map(x => x.a)
        expect(ret.toArray()).to.deep.equal([2, 3]);
        expect(ret.toArray()).to.deep.equal([2, 3]);
    })
    
    
    it('concat', () => {
        const ret = new Linq([1, 2, 3])
            .concat(new Linq([4, 5]));
        expect(ret.toArray()).to.deep.equal([1, 2, 3, 4, 5]);
        expect(ret.toArray()).to.deep.equal([1, 2, 3, 4, 5]);
    })
});