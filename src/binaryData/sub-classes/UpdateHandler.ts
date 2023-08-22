import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { bytesPerRow } from "../constants";

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

            that.desiredTopRow.subscribe(()=>{
                that.intermediateTopRow.value = that.desiredTopRow.value;
            })
            that.intermediateTopRow.subscribe(async ()=>{
                that.intermediateTopRow.lock();
                that.dataToRender.value = await that.getPage(that.intermediateTopRow.value * bytesPerRow);
            })
            that.dataToRender.subscribe(()=>{
                requestAnimationFrame(()=>{
                    that.render();
                })
            })
            that.renderedTopRow.subscribe(()=>{
                that.intermediateTopRow.unlock();
                that.intermediateTopRow.value = that.desiredTopRow.value;
            })
            that.viewportRowCount.subscribe(()=>{
                that.render();
            })
            that.currentFile.subscribe(()=>{
                that.rows.forEach(row=>{
                    row.startByteNumber = -Infinity;
                })
                that.desiredTopRow.value = 0;
                that.render();
            });
        }
    };

    return chainImpl(cls);
}