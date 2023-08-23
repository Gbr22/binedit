import type { EditorThis } from "../editor";
import styles from "../styles.module.scss";
import { Base, chainImpl, type Constructor } from "../composition";
import { bytesPerRow, rowHeight } from "../constants";
import { DerivedVar, TrackedVar } from "../reactivity";
import upIcon from '@/assets/icons/chevron-up.svg?raw';
import downIcon from '@/assets/icons/chevron-down.svg?raw';

export function ImplScrollHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        scrollRowCount!: DerivedVar<number>;
        scrollBarType!: DerivedVar<"virtual" | "native">;

        scrollHandler = {
            scrollBar: document.createElement("div")
        }

        initScrollHandler(): void {
            const that = this as any as EditorThis;

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
                that.desiredState.value = that.desiredState.value.with({
                    topRow: Math.ceil(that.fileRowCount.value * scrollPercent)
                })
            })
    
            that.element.addEventListener("wheel",(e)=>{
                if (that.scrollBarType.value == "native"){
                    return;
                }
                const delta = e.deltaY;
                const deltaRow = Math.round(delta / rowHeight);
                let newTopRow = that.desiredState.value.topRow + deltaRow;
                if (newTopRow < 0){
                    newTopRow = 0;
                }
                that.desiredState.value = that.desiredState.value.with({
                    topRow: newTopRow
                });
            })

            this.createVirtualScrollBar();
        }
        createVirtualScrollBar(){
            const that = this as unknown as EditorThis;

            const scrollBar = this.scrollHandler.scrollBar;
            scrollBar.classList.add(styles["scroll-bar"]);
            that.element.appendChild(scrollBar);
        
            const upArrow = document.createElement("button");
            upArrow.classList.add(styles["up-arrow"]);
            upArrow.innerHTML = upIcon;
        
            const downArrow = document.createElement("button");
            downArrow.classList.add(styles["down-arrow"]);
            downArrow.innerHTML = downIcon;
        
            const scrollBarTrack = document.createElement("div");
            scrollBarTrack.classList.add(styles["scroll-bar-track"]);
            const scrollBarTrackPadding = document.createElement("div");
            scrollBarTrackPadding.classList.add(styles["scroll-bar-track-padding"]);
        
            scrollBar.appendChild(upArrow);
            scrollBar.appendChild(scrollBarTrack);
            scrollBar.appendChild(scrollBarTrackPadding);
            scrollBar.appendChild(downArrow);
        
            const scrollBarHandle = document.createElement("button");
            scrollBarHandle.classList.add(styles["scroll-bar-handle"]);
            scrollBarTrack.appendChild(scrollBarHandle);

            interface ScrollStart {
                y: number
                scrollPercent: number
            }
        
            let scrollStart: ScrollStart | null = null;
            let scrollPercent = 0;
            scrollBarHandle.addEventListener("mousedown",(e)=>{
                scrollStart = {
                    y: e.clientY,
                    scrollPercent
                };
            })
            window.addEventListener("mousemove",(e)=>{
                if (!scrollStart){
                    return;
                }
                const diff = e.clientY - scrollStart.y;
                const height = scrollBarTrack.clientHeight;
                const percent = diff/height + scrollStart.scrollPercent;
                const scrollPercent = Math.max(0,Math.min(percent,1));
                that.desiredState.value = that.desiredState.value.with({
                    topRow: Math.ceil(that.fileRowCount.value * scrollPercent)
                });
            })
            window.addEventListener("mouseup",()=>{
                scrollStart = null;
            })

            that.desiredState.subscribe(()=>{
                const { topRow, file } = that.desiredState.value;
                const percent = file ? ( (topRow * bytesPerRow) / file.file.size ) : 0;
                scrollPercent = Math.max(0,Math.min(percent,1));
                scrollBar.style.setProperty("--scroll-percent",scrollPercent.toString());
            })
        }
    };

    return chainImpl(cls);
}