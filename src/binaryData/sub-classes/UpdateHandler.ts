import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";

const animMap = new Map<string, boolean>()

function queueAnimationFrame(key: string, fn: ()=>unknown){
    if (animMap.get(key)){
        return;
    }
    requestAnimationFrame(()=>{
        animMap.delete(key)
        fn();
    })
}

type PromiseMapItem<T> = {
    promise: Promise<T>
    after?: ()=>Promise<T>
}

const promiseMap = new Map<string, PromiseMapItem<unknown>>();

function queueAsync<T>(key: string, fn: ()=>Promise<T>){
    if (promiseMap.has(key)){
        let item = promiseMap.get(key) as PromiseMapItem<T>;
        item.after = fn;
        return item.promise;
    }
    const promise = fn();
    promise.finally(()=>{
        promiseMap.delete(key);
    })
    promiseMap.set(key,{
        promise,
    })
    return promise;
}

export function ImplUpdateHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {

        initUpdateHandler(){
            const that = this as any as EditorThis;

            that.topRow.subscribe(()=>{
                queueAnimationFrame("render",()=>{
                    queueAsync("render",()=>{
                        return that.render()
                    });
                })
            })
            that.viewportRowCount.subscribe(()=>{
                that.render();
            })
            that.currentFile.subscribe(()=>{
                that.topRow.value = 0;
                that.rows.forEach(row=>{
                    row.startByteNumber = -Infinity;
                })
                that.render();
            });
        }
    };

    return chainImpl(cls);
}