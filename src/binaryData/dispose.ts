function isDisposable(v: unknown): v is Disposable {
    if (!(v instanceof Object)){
        return false;
    }
    if (!(Symbol.dispose in v)){
        return false;
    }
    const fn = v[Symbol.dispose];
    if (!(fn instanceof Function)){
        return false;
    }
    return true;
}

export function disposeChildren(object: object){
    for (const p in object){
        const value = (object as any)[p] as unknown;
        if (isDisposable(value)) {
            try {
                value[Symbol.dispose]();
            } catch(_){};
        }
    }
}