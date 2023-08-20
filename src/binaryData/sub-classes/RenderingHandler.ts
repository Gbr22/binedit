import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { DerivedVar, DidNotExecute, TrackedVar, createDependantFunction } from "../reactivity";
import { bytesPerRow, rowHeight } from "../constants";
import type { EditorFile } from "../EditorFile";
import type { Row } from "../row";

export function ImplRenderingHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        async render(){
            const that = this as any as EditorThis;

            that.element.dataset["scrollType"] = `${that.scrollBarType.value}`;
            if (that.scrollBarType.value == "virtual"){
                that.element.scrollTop = 0;
            }
            that.scrollView.style.setProperty('--row-count',that.scrollRowCount.value.toString());
            const top = (that.topRow.value % 1024);
            const shift = that.topRow.value - top;
            that.dataView.style.setProperty('--top',top.toString());
            const promises: Promise<void>[] = [];
            for(let renderIndex = 0; renderIndex < that.viewportRowCount.value; renderIndex++){
                const promise = (async ()=>{
                    const index = that.topRow.value + renderIndex;
                    const startByte = index * bytesPerRow;
                    const row: Row = that.rowMap.get(startByte) ?? await that.recycleOrCreateRow({
                        renderIndex,
                        startByte
                    });
                    const shiftedIndex = index - shift;
                    row.container.style.setProperty('--index',shiftedIndex.toString());
                })()
                promises.push(promise);
            }
            await Promise.all(promises);
            that.collectGarbage();
        }
    };

    return chainImpl(cls);
}