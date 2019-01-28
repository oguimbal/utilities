

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
