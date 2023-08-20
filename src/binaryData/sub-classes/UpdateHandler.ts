import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { createDependantFunction } from "../reactivity";

const map = new Map<string, boolean>()

function queueAnimationFrame(key: string, fn: ()=>unknown){
    if (map.get(key)){
        return;
    }
    requestAnimationFrame(()=>{
        map.delete(key)
        fn();
    })
}

export function ImplUpdateHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {

        initUpdateHandler(){
            const that = this as any as EditorThis;

            that.topRow.subscribe(()=>{
                queueAnimationFrame("render",()=>{
                    that.render();
                })
            })
            that.viewportRowCount.subscribe(()=>{
                that.render();
            })
            that.currentFile.subscribe(()=>{
                that.topRow.value = 0;
                that.render();
                that.redrawAll();
            });
        }
    };

    return chainImpl(cls);
}