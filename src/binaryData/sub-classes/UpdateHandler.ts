import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { bytesPerRow } from "../constants";
import { TrackedVar, struct, type Struct } from "../reactivity";
import type { EditorFile } from "../EditorFile";
import type { DataProvider } from "../dataProvider";

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

export interface State {
    topRow: number
    dataProvider: DataProvider | undefined
    width: number
    height: number
}

function createDefaultState(): Struct<State> {
    return struct({
        topRow: 0,
        dataProvider: undefined,
        width: 0,
        height: 0,
    })
}

export function ImplUpdateHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {

        desiredState = new TrackedVar(createDefaultState());
        intermediateState = new TrackedVar(createDefaultState());
        renderedState = new TrackedVar(createDefaultState());

        initUpdateHandler(){
            const that = this as any as EditorThis;

            that.desiredState.subscribe(()=>{
                that.intermediateState.value = that.desiredState.value;
            })
            that.intermediateState.subscribe(async ()=>{
                that.intermediateState.lock();
                that.dataToRender.value = await that.getPage(that.intermediateState.value.topRow * bytesPerRow);
            })
            that.dataToRender.subscribe(()=>{
                requestAnimationFrame(()=>{
                    that.render();
                })
            })
            that.renderedState.subscribe(()=>{
                that.intermediateState.unlock();
                that.intermediateState.value = that.desiredState.value;
            })
            that.viewportRowCount.subscribe(()=>{
                that.render();
            })
            that.dataProvider.subscribe(()=>{
                that.rows.forEach(row=>{
                    row.startByteNumber = -Infinity;
                })
                that.desiredState.value = that.desiredState.value.with({
                    topRow: 0,
                    dataProvider: that.dataProvider.value,
                });
                that.render();
            });
        }
    };

    return chainImpl(cls);
}