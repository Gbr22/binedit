export const dispose = Symbol("dispose function");
type dispose = typeof dispose;
export interface Disposable {
    [dispose]: ()=>void
}

function isDisposable(v: unknown): v is Disposable {
    if (!(v instanceof Object)){
        return false;
    }
    if (!(dispose in v)){
        return false;
    }
    const fn = v[dispose];
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
                value[dispose]();
            } catch(_){};
        }
    }
}