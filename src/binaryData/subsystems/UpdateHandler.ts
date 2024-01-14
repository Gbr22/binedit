import { Editor } from "../editor";
import { bytesPerRow } from "../constants";
import { TrackedVar, struct, type Struct } from "../reactivity";
import { BlobProvider, type DataProvider } from "../dataProvider";
import { defineSubsystem } from "../composition";

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
    dataProvider: DataProvider
    width: number
    height: number
}

function createDefaultState(): Struct<State> {
    return struct({
        topRow: 0,
        dataProvider: new BlobProvider(new Blob([])),
        width: 0,
        height: 0,
    })
}

export const UpdateHandler = defineSubsystem({
    name: "UpdateHandler",
    proto: {},
    init(this: Editor): {
        desiredState: TrackedVar<Struct<State>>;
        intermediateState: TrackedVar<Struct<State>>;
        renderedState: TrackedVar<Struct<State>>;
    } {
        const desiredState = new TrackedVar(createDefaultState());
        const intermediateState = new TrackedVar(createDefaultState());
        const renderedState = new TrackedVar(createDefaultState());
    
        desiredState.subscribe(()=>{
            this.intermediateState.value = this.desiredState.value;
        })
        intermediateState.subscribe(async ()=>{
            if (!this.intermediateState.value.dataProvider){
                return;
            }
            this.intermediateState.lock();
            this.dataToRender.value = await this.getRenderPage(
                this.intermediateState.value.dataProvider,
                this.intermediateState.value.topRow * bytesPerRow
            );
        })
        this.dataToRender.subscribe(()=>{
            requestAnimationFrame(()=>{
                this.render();
            })
        })
        renderedState.subscribe(()=>{
            this.intermediateState.unlock();
            this.intermediateState.value = this.desiredState.value;
        })
        this.viewportRowCount.subscribe(()=>{
            this.render();
        })

        return {
            desiredState,
            intermediateState,
            renderedState
        };
    },
});
