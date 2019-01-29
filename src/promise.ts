

export function infinitePromise<T>() {
    return new Promise<T>(function(){});
}


export function delay(time: number): Promise<void> {
    return new Promise<void>((done) => setTimeout(done, time));
}


export function processValue(valueGetter, callback, errorCallback?) {
    while (typeof valueGetter === 'function')
        valueGetter = valueGetter();
    if (valueGetter instanceof Promise) {
        valueGetter.then(callback, errorCallback);
    }else if (valueGetter && valueGetter.subscribe && typeof valueGetter.subscribe === 'function') {
        valueGetter.subscribe(callback, errorCallback);
    }
    else// the value getter IS the data
        callback(valueGetter);
}

export class Lazy<T> {
    private val: T;
    private valGot: boolean;
    constructor(private ctor: () => T) {
    }
    get hasValue() {
        return !!this.valGot;
    }

    get value(): T {
        if (this.valGot)
            return this.val;
        this.val = this.ctor();
        this.valGot = true;
        return this.val;
    }
    
    static resolve<T>(value: T): any {
        const ret = new Lazy<T>(null);
        ret.val = value;
        ret.valGot = true;
        return ret;
    }
}