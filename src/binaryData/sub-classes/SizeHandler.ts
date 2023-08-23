import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { TrackedVar } from "../reactivity";
import { rowHeight } from "../constants";

export function ImplSizeHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        viewportRowCount = new TrackedVar(0);
        
        resize(){
            const that = this as any as EditorThis;
            const rect = that.element.getBoundingClientRect();
            this.viewportRowCount.value = Math.floor(rect.height / rowHeight);
            that.desiredState.value = that.desiredState.value.with({
                width: Math.round(rect.width * window.devicePixelRatio),
                height: Math.round(rect.height * window.devicePixelRatio)
            })
        }

        toValidTopRow(topRow: number){
            if (topRow < 0){
                return 0;
            }
            const that = this as any as EditorThis;
            const maxRow = that.fileRowCount.value - Math.floor(that.viewportRowCount.value / 2);
            if (topRow > maxRow){
                return maxRow;
            }
            return topRow;
        }

        initSizeHandler(){
            const that = this as any as EditorThis;
            const resizeObserver = new ResizeObserver((entries) => {
                that.resize();
            });
            
            resizeObserver.observe(that.element);
        }
    };

    return chainImpl(cls);
}