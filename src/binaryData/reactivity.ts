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

    static changedSince(n: number, ...rest: TrackedVar<any>[]){
        for (let e of rest){
            if (e.lastChanged > n){
                return true;
            }
        }
        return false;
    }
}

export class DerivedVar<Var,Dependecies extends (TrackedVar<any> | DerivedVar<any,any>)[]> {

    fn: (...deps: Dependecies)=> Var;

    deps: Dependecies;

    constructor(fn: (...deps: Dependecies)=> Var, ...deps: Dependecies){
        this.fn = fn;
        this.deps = deps;
    }

    get value(){
        return this.fn(...this.deps);
    }
}