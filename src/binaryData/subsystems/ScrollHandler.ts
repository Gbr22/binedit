import { Editor } from "../editor";
import { bytesPerRow, rowHeight } from "../constants";
import { DerivedVar } from "../reactivity";
import { getDataProviderRowCount } from "./DataHandler";
import { defineSubsystem } from "../composition";

export const ScrollHandler = defineSubsystem({
    name: "ScrollHandler",
    proto: {
        createVirtualScrollBar(this: Editor): void {
            const scrollBar = this.scrollHandler.scrollBar;
            scrollBar.classList.add("scrollbar");
            (scrollBar as any).part = "scrollbar";
            this.innerContainer.appendChild(scrollBar);
        
            const upButton = document.createElement("button");
            upButton.classList.add("scrollbar-button");
            upButton.classList.add("up");
            (upButton as any).part = "scrollbar-button up";
        
            const downButton = document.createElement("button");
            downButton.classList.add("scrollbar-button");
            downButton.classList.add("down");
            (downButton as any).part = "scrollbar-button down";

            const scrollBarHandleContainer = document.createElement("div");
            scrollBarHandleContainer.classList.add("scrollbar-track");
            const scrollBarTrackPadding = document.createElement("div");
            scrollBarTrackPadding.classList.add("scrollbar-track-padding");
        
            scrollBar.appendChild(upButton);
            scrollBar.appendChild(scrollBarHandleContainer);
            scrollBar.appendChild(scrollBarTrackPadding);
            scrollBar.appendChild(downButton);
        
            const scrollBarHandle = document.createElement("button");
            scrollBarHandle.classList.add("scrollbar-handle");
            scrollBarHandleContainer.appendChild(scrollBarHandle);
            (scrollBarHandle as any).part = "scrollbar-handle";
        
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
                const height = scrollBarHandleContainer.clientHeight;
                const percent = diff/height + scrollStart.scrollPercent;
                const scrollPercent = Math.max(0,Math.min(percent,1));
                this.desiredState.value = this.desiredState.value.with({
                    topRow: this.toValidTopRow(this.desiredState.value.dataProvider ,Math.ceil(getDataProviderRowCount(this.desiredState.value.dataProvider) * scrollPercent))
                });
            })
            window.addEventListener("mouseup",()=>{
                scrollStart = null;
            })
        
            const step = (dir: 1 | -1)=>{
                let newTopRow = this.desiredState.value.topRow + dir;
                this.desiredState.value = this.desiredState.value.with({
                    topRow: this.toValidTopRow(this.desiredState.value.dataProvider, newTopRow)
                });
            }
        
            upButton.onclick = ()=>{
                step(-1);
            }
            downButton.onclick = ()=>{
                step(1);
            }
        
            this.desiredState.subscribe(()=>{
                const { topRow, dataProvider } = this.desiredState.value;
                const percent = dataProvider ? ( (topRow * bytesPerRow) / dataProvider.size ) : 0;
                scrollPercent = Math.max(0,Math.min(percent,1));
                scrollBar.style.setProperty("--scroll-percent",scrollPercent.toString());
            })
        }
    },
    init(this: Editor): {
        scrollRowCount: DerivedVar<number>;
        scrollBarType: DerivedVar<"virtual" | "native">;
        scrollHandler: {
            scrollBar: HTMLDivElement
        }
    } {
        const scrollHandler = {
            scrollBar: document.createElement("div")
        }
        const scrollRowCount = new DerivedVar(()=>{
            return Math.min(10000, getDataProviderRowCount(this.desiredState.value.dataProvider));
        },this.desiredState)
    
        const scrollBarType = new DerivedVar(()=>{
            if (getDataProviderRowCount(this.desiredState.value.dataProvider) > 10000){
                return "virtual";
            }
            return "native";
        },this.desiredState);
    
        this.innerContainer.addEventListener("scroll",()=>{
            const scrollPercent = this.innerContainer.scrollTop / ( this.innerContainer.scrollHeight - (this.innerContainer.clientHeight / 2) );
            this.desiredState.value = this.desiredState.value.with({
                topRow: Math.ceil(getDataProviderRowCount(this.desiredState.value.dataProvider) * scrollPercent)
            })
        })
    
        this.innerContainer.addEventListener("wheel",(e)=>{
            if (scrollBarType.value == "native"){
                return;
            }
            const delta = e.deltaY;
            const deltaRow = Math.round(delta / rowHeight);
            let newTopRow = this.desiredState.value.topRow + deltaRow;
            this.desiredState.value = this.desiredState.value.with({
                topRow: this.toValidTopRow(this.desiredState.value.dataProvider,newTopRow)
            });
        })
    
        const props = {
            scrollHandler,
            scrollBarType,
            scrollRowCount
        }

        Object.assign(this,props);
        this.createVirtualScrollBar();

        return props;
    },
});
