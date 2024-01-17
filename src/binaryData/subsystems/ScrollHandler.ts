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
            scrollBarHandle.tabIndex = -1;
            scrollBarHandleContainer.appendChild(scrollBarHandle);
            (scrollBarHandle as any).part = "scrollbar-handle";
        
            interface ScrollStart {
                y: number
                scrollRatio: number
            }
        
            let scrollStart: ScrollStart | null = null;
            let scrollPercent = 0;
            scrollBarHandle.addEventListener("mousedown",(e)=>{
                scrollStart = {
                    y: e.clientY,
                    scrollRatio: scrollPercent
                };
            })
            window.addEventListener("mousemove",(e)=>{
                if (!scrollStart){
                    return;
                }
                const diff = e.clientY - scrollStart.y;
                const height = scrollBarHandleContainer.clientHeight;
                const ratio = diff/height + scrollStart.scrollRatio;
                const boundRatio = Math.max(0,Math.min(ratio,1));
                const documentSize = this.desiredState.value.dataProvider.size;
                const index = this.getDocumentBoundIndex(this.getIndexFromRatio(boundRatio, documentSize), documentSize);
                this.desiredState.value = this.desiredState.value.with({
                    positionInFile: index
                });
            })
            window.addEventListener("mouseup",()=>{
                scrollStart = null;
            })
        
            const step = (dir: 1 | -1)=>{
                const newPosition = this.desiredState.value.positionInFile + dir * this.bytesPerRow;
                const boundPos = this.getDocumentBoundIndex(newPosition,this.desiredState.value.dataProvider.size);
                this.desiredState.value = this.desiredState.value.with({
                    positionInFile: boundPos
                });
            }
        
            upButton.onclick = ()=>{
                step(-1);
            }
            downButton.onclick = ()=>{
                step(1);
            }

            this.desiredState.subscribe(()=>{
                const { positionInFile, dataProvider } = this.desiredState.value;
                const ratio = positionInFile / dataProvider.size;
                scrollPercent = Math.max(0,Math.min(ratio,1));
                const index = this.getIndexFromRatio(scrollPercent, this.desiredState.value.dataProvider.size);
                const alignedIndex = this.getRowAlignedIndex(index);
                scrollBar.style.setProperty("--scroll-percent",scrollPercent.toString());
            })
        },
        getScrollTopFromIndex(this: Editor, index: number, documentSize: number){
            const aligned = this.getDocumentBoundIndex(index, documentSize);
            const ratio = this.getRatioFromIndex(aligned, documentSize);
            return ratio * this.innerContainer.scrollHeight;
        },
        getRatioFromIndex(this: Editor, index: number, documentSize: number){
            return index / documentSize;
        },
        getIndexFromRatio(this: Editor, ratio: number, documentSize: number){
            return Math.round(ratio * documentSize);
        },
        getRowAlignedIndex(this: Editor, index: number){
            const rowNumber = Math.floor(index / this.bytesPerRow);
            const newIndex = rowNumber * this.bytesPerRow;
            return newIndex;
        },
        getDocumentBoundIndex(this: Editor, index: number, documentSize: number){
            const aligned = this.getRowAlignedIndex(index);
            const min = 0;
            const minBound = Math.max(min,aligned);
            const max = this.getRowAlignedIndex(documentSize) - this.getRowAlignedIndex( ( (this.viewportRowCount.value+2) * this.bytesPerRow ) / 2 );
            const maxBound = Math.min(minBound,max);
            
            return maxBound;
        },
        changeNativeScrollerPosition(this: Editor, index: number, documentSize: number){
            const top = this.getScrollTopFromIndex(index, documentSize);
            
            this.innerContainer.scrollTo({
                top: top,
                behavior: "instant"
            })
        },
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
            if (this.scrollBarType.value != "native"){
                return;
            }
            const ratio = this.innerContainer.scrollTop / ( this.innerContainer.scrollHeight - (this.innerContainer.clientHeight / 2) );
            const index = this.getIndexFromRatio(ratio, this.desiredState.value.dataProvider.size);
            this.desiredState.value = this.desiredState.value.with({
                positionInFile: this.getDocumentBoundIndex(index,this.desiredState.value.dataProvider.size)
            })
            this.forceUpdateHover();
        },{passive: true})
    
        this.innerContainer.addEventListener("wheel",(e)=>{
            if (scrollBarType.value == "native"){
                return;
            }
            const delta = e.deltaY;
            const deltaRow = Math.round(delta / rowHeight);
            const newIndex = this.desiredState.value.positionInFile + deltaRow * this.bytesPerRow;
            const boundIndex = this.getDocumentBoundIndex(newIndex,this.desiredState.value.dataProvider.size);
            this.desiredState.value = this.desiredState.value.with({
                positionInFile: boundIndex
            });
            this.forceUpdateHover();
        },{passive: true});
    
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
