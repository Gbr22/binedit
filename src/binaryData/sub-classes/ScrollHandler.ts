import type { EditorThis } from "../editor";
import styles from "../styles.module.scss";
import { createVirtualScrollBar } from "../virtualScrollbar";
import { Base, chainImpl, type Constructor } from "../composition";
import { rowHeight } from "../constants";
import { DerivedVar, TrackedVar } from "../reactivity";

export function ImplScrollHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        scrollRowCount!: DerivedVar<number>;
        scrollBarType!: DerivedVar<"virtual" | "native">;
        topRow!: TrackedVar<number>;

        initScrollHandler(): void {
            const that = this as any as EditorThis;

            this.topRow = new TrackedVar(0);

            this.scrollRowCount = new DerivedVar(()=>{
                return Math.min(10000, that.fileRowCount.value);
            },that.fileRowCount)

            this.scrollBarType = new DerivedVar(()=>{
                if (that.fileRowCount.value > 10000){
                    return "virtual";
                }
                return "native";
            },that.fileRowCount);

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

    return chainImpl(cls);
}