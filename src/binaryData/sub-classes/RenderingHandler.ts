import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { DerivedVar, TrackedVar, createDependantFunction } from "../reactivity";
import { bytesPerRow, rowHeight } from "../constants";
import type { EditorFile } from "../EditorFile";
import type { Row } from "../row";

export function ImplRenderingHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        updateDom!: ()=>void

        initRenderingHandler(){
            const that = this as any as EditorThis;
            this.updateDom = createDependantFunction(()=>{
                that.element.dataset["scrollType"] = `${that.scrollBarType.value}`;
                if (that.scrollBarType.value == "virtual"){
                    that.element.scrollTop = 0;
                }
                that.scrollView.style.setProperty('--row-count',that.scrollRowCount.value.toString());
                const top = (that.topRow.value % 1024);
                const shift = that.topRow.value - top;
                that.dataView.style.setProperty('--top',top.toString());
                console.group("update");
                console.log(that.rowMap);
                for(let renderIndex = 0; renderIndex < that.viewportRowCount.value; renderIndex++){
                    const index = that.topRow.value + renderIndex;
                    const startByte = index * bytesPerRow;
                    console.log(index,!!that.rowMap.get(startByte));
                    const row: Row = that.rowMap.get(startByte) ?? that.recycleOrCreateRow({
                        renderIndex,
                        startByte
                    });
                    const shiftedIndex = index - shift;
                    row.container.style.setProperty('--index',shiftedIndex.toString());
                }
                console.groupEnd();
                that.collectGarbage();
            }, that.topRow, that.currentFile, that.viewportRowCount)
        }
    };

    return chainImpl(cls);
}