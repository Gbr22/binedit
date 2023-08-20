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
        this.subs.forEach(fn=>{
            fn();
        })
    }
    lastChanged: number

    subs = new Set<()=>unknown>()

    subscribe(fn: ()=>unknown){
        this.subs.add(fn);
    }

    constructor(t: V){
        this.#_value = t;
        this.lastChanged = Date.now()
    }
}

export function changedSince(n: number, ...rest: (TrackedVar<any> | DerivedVar<any>)[]){
    for (let e of rest){
        if (e.lastChanged > n){
            return true;
        }
    }
    return false;
}

export class DerivedVar<Var> {

    fn: () => Var;

    deps: (TrackedVar<any> | DerivedVar<any>)[];

    #_value: Var | undefined
    #_lastChanged: number = 0;

    get lastChanged(): number {
        return this.#_lastChanged;
    }

    update(){
        let newVal = this.fn();
        if (newVal == this.#_value){
            return;
        }
        this.#_value = newVal;
        this.#_lastChanged = Date.now();
        this.subs.forEach(fn=>{
            fn();
        })
    }

    constructor(fn: ()=> Var, ...deps: (TrackedVar<any> | DerivedVar<any>)[]){
        this.fn = fn;
        this.deps = deps;
        this.deps.forEach(dep=>{
            dep.subscribe(()=>{
                this.update();
            })
        })
    }

    subs = new Set<()=>unknown>()

    subscribe(fn: ()=>unknown){
        this.subs.add(fn);
    }

    get value(){
        return this.fn();
    }
}

export const DidNotExecute = Symbol("Did not execute");

export function createDependantFunction<
    Fn extends (...args: any[])=>any,
    Dependecies extends (TrackedVar<any> | DerivedVar<any>)[]
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