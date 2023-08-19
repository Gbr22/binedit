import type { EditorThis } from "../editor";
import styles from "../styles.module.scss";
import { createVirtualScrollBar } from "../virtualScrollbar";
import { Base, type Constructor } from "../composition";
import { rowHeight } from "../constants";

export interface IScrollHandler {
    registerScrollEventListeners(): void
}

export function ImplScrollHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    
    return class extends constructor implements IScrollHandler {
        registerScrollEventListeners(): void {
            const that = this as any as EditorThis;
            that.element.addEventListener("scroll",()=>{
                const scrollPercent = that.element.scrollTop / ( that.element.scrollHeight - (that.element.clientHeight / 2) );
                that.topRow.value = Math.ceil(that.fileRowCount.value * scrollPercent);
                that.updateDom();
            })
    
            that.element.addEventListener("wheel",(e)=>{
                if (that.scrollBarType.value == "native"){
                    return;
                }
                const delta = e.deltaY;
                const deltaRow = Math.round(delta / rowHeight);
                let newTopRow = that.topRow.value + deltaRow;
                if (newTopRow < 0){
                    newTopRow = 0;
                }
                that.topRow.value = newTopRow;
                that.updateDom();
            })
        }
    };
}