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

const promiseMap = new Map<string, Promise<unknown>>();

function deduplicatePromise<T>(key: string, fn: ()=>Promise<T>, afterfn: ()=>unknown){
    if (promiseMap.has(key)){
        return promiseMap.get(key) as Promise<T>;
    }
    const promise = fn();
    promise.finally(()=>{
        promiseMap.delete(key);
        afterfn();
    })
    promiseMap.set(key,promise);
    return promise;
}

export function ImplUpdateHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {

        initUpdateHandler(){
            const that = this as any as EditorThis;

            that.topRow.subscribe(()=>{
                console.log("toprow",that.topRow.value);
                queueAnimationFrame("render",()=>{
                    let topRow = that.topRow.value;
                    deduplicatePromise("render",()=>{
                        return that.render()
                    },()=>{
                        if (that.topRow.value != topRow){
                            that.render();
                        }
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