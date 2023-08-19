import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { TrackedVar } from "../reactivity";
import { rowHeight } from "../constants";

export function ImplSizeHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        viewportRowCount = new TrackedVar(0);
        
        reflow(){
            const that = this as any as EditorThis;
            const rect = that.element.getBoundingClientRect();
            this.viewportRowCount.value = Math.floor(rect.height / rowHeight);
            that.updateDom();
        }

        initSizeHandler(){
            const that = this as any as EditorThis;
            const resizeObserver = new ResizeObserver((entries) => {
                that.reflow();
                that.updateDom();
            });
            
            resizeObserver.observe(that.element);
        }
    };

    return chainImpl(cls);
}