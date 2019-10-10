import 'reflect-metadata';
import 'mocha';
import { expect, assert } from 'chai';
import { deepEqual } from '../src/data';


describe('Data utilities', () => {

    it('Deep equals - loose', () => {
        assert.isTrue(deepEqual({ a: 1, b: null, c: [12]}, { a: 1, c: [12]}));
    })
    it('Deep equals - strict', () => {
        assert.isFalse(deepEqual({ a: 1, b: null, c: [12]}, { a: 1, c: [12]}, true));
        assert.isFalse(deepEqual({ a: 1, b: null, c: [12]}, { a: 1, b: undefined, c: [12]}, true));
        assert.isTrue(deepEqual({ a: 1, b: null, c: [12]}, { a: 1, b: null, c: [12]}, true));
    })
});
