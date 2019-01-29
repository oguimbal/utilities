
export interface CodeLocation {
    file: string;
    line: number;
    method: string;
}


export function getCodeLocation(ignoreFile?: (file: string, method?: string) => boolean): CodeLocation {
    const stack = new Error().stack;
    let file: string;
    let line: number;
    let method: string;
    // let code: string;
    for (const step of stack.split('\n')) {
        const ret = /at (.+)\((.+):(\d+):\d+\)/.exec(step);
        if (!ret || !ret.length)
            continue;
        method = ret[1];
        file = ret[2];
        line = parseInt(ret[3], 10);
        if (/(\/|\\)utils\.ts/.test(file) || /(\/|\\)node_modules(\/|\\)/.test(file))
            continue
        if (ignoreFile && ignoreFile(file, method))
            continue;
        break;
    }
    return {file, line, method};
}

export function getCallerFile() {
    const oldPrepare = Error.prepareStackTrace;
    try {
        const err = new Error();
        let callerfile;
        let currentfile;

        Error.prepareStackTrace = function (_, stack) { return stack; };

        currentfile = (<NodeJS.CallSite[]><any> err.stack).shift().getFileName();

        while (err.stack.length) {
            callerfile = (<NodeJS.CallSite[]><any> err.stack).shift().getFileName();

            if (currentfile !== callerfile)
                return callerfile;
        }
    } catch (err) {}
    finally {
        Error.prepareStackTrace = oldPrepare;
    }
    return undefined;
}

export function isInEnum(enumRef: any, value: any) {
    return Object.keys(enumRef).map(x => enumRef[x]).includes(value);
}
