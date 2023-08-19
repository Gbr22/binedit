export class TrackedVar<V> {
    #_value: V
    get value(){
        return this.#_value;
    }
    set value(n){
        if (this.#_value == n){
            return;
        }
        this.#_value = n;
        this.lastChanged = Date.now();
    }
    lastChanged: number

    constructor(t: V){
        this.#_value = t;
        this.lastChanged = Date.now()
    }
}

function changedSince(n: number, ...rest: (TrackedVar<any> | DerivedVar<any,any>)[]){
    for (let e of rest){
        if (e.lastChanged > n){
            return true;
        }
    }
    return false;
}

export class DerivedVar<Var,Dependecies extends (TrackedVar<any> | DerivedVar<any,any>)[]> {

    fn: ()=> Var;

    deps: Dependecies;

    get lastChanged(): number {
        return Math.max(...this.deps.map(e=>e.lastChanged));
    }

    constructor(fn: ()=> Var, ...deps: Dependecies){
        this.fn = fn;
        this.deps = deps;
    }

    get value(){
        return this.fn();
    }
}

export const DidNotExecute = Symbol("Did not execute");

export function createDependantFunction<
    Fn extends (...args: any[])=>any,
    Dependecies extends (TrackedVar<any> | DerivedVar<any,any>)[]
>(fn: Fn, ...deps: Dependecies){
    let lastCall = 0;
    const newFn = (...args: Parameters<Fn>): ReturnType<Fn> | typeof DidNotExecute =>{
        const changed = changedSince(
            lastCall,
            ...deps,
        );
        if (!changed){
            return DidNotExecute;
        }
        const ret = fn(...args);
        lastCall = Date.now();
        return ret;
    }
    return newFn;
}