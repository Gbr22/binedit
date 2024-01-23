import { Editor } from "../editor";
import { rowHeight } from "../constants";
import { DerivedVar } from "../reactivity";
import { getDataProviderRowCount } from "./DataManager";

export class ScrollManager {
    editor: Editor

    scrollRowCount: DerivedVar<number>;
    scrollBarType: DerivedVar<"virtual" | "native">;
    scrollHandler: {
        scrollBar: HTMLDivElement
    } = {
        scrollBar: document.createElement("div")
    }

    constructor(editor: Editor){
        this.editor = editor;
        this.scrollRowCount = new DerivedVar(()=>{
            return Math.min(10000, getDataProviderRowCount(this.editor.update.desiredState.value.dataProvider));
        },this.editor.update.desiredState);
        this.scrollBarType = new DerivedVar(()=>{
            if (getDataProviderRowCount(this.editor.update.desiredState.value.dataProvider) > 10000){
                return "virtual";
            }
            return "native";
        },this.editor.update.desiredState);

        this.editor.dom.innerContainer.addEventListener("scroll",()=>{
            if (this.scrollBarType.value != "native"){
                return;
            }
            const ratio = this.editor.dom.innerContainer.scrollTop / ( this.editor.dom.innerContainer.scrollHeight - (this.editor.dom.innerContainer.clientHeight / 2) );
            const index = this.getIndexFromRatio(ratio, this.editor.update.desiredState.value.dataProvider.size);
            this.editor.update.desiredState.value = this.editor.update.desiredState.value.with({
                positionInFile: this.getDocumentBoundIndex(index,this.editor.update.desiredState.value.dataProvider.size)
            })
            this.editor.gesture.mouse.forceUpdateHover();
        },{passive: true})
    
        this.editor.dom.innerContainer.addEventListener("wheel",(e)=>{
            if (this.scrollBarType.value == "native"){
                return;
            }
            const delta = e.deltaY;
            const deltaRow = Math.round(delta / rowHeight);
            const newIndex = this.editor.update.desiredState.value.positionInFile + deltaRow * this.editor.renderer.bytesPerRow;
            const boundIndex = this.getDocumentBoundIndex(newIndex,this.editor.update.desiredState.value.dataProvider.size);
            this.editor.update.desiredState.value = this.editor.update.desiredState.value.with({
                positionInFile: boundIndex
            });
            this.editor.gesture.mouse.forceUpdateHover();
        },{passive: true});
    
        this.createVirtualScrollBar();
    }

    createVirtualScrollBar(): void {
        const scrollBar = this.scrollHandler.scrollBar;
        scrollBar.classList.add("scrollbar");
        (scrollBar as any).part = "scrollbar";
        this.editor.dom.innerContainer.appendChild(scrollBar);
    
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
            const documentSize = this.editor.update.desiredState.value.dataProvider.size;
            const index = this.getDocumentBoundIndex(this.getIndexFromRatio(boundRatio, documentSize), documentSize);
            this.editor.update.desiredState.value = this.editor.update.desiredState.value.with({
                positionInFile: index
            });
        })
        window.addEventListener("mouseup",()=>{
            scrollStart = null;
        })
    
        const step = (dir: 1 | -1)=>{
            const newPosition = this.editor.update.desiredState.value.positionInFile + dir * this.editor.renderer.bytesPerRow;
            const boundPos = this.getDocumentBoundIndex(newPosition,this.editor.update.desiredState.value.dataProvider.size);
            this.editor.update.desiredState.value = this.editor.update.desiredState.value.with({
                positionInFile: boundPos
            });
        }
    
        upButton.onclick = ()=>{
            step(-1);
        }
        downButton.onclick = ()=>{
            step(1);
        }

        this.editor.update.desiredState.subscribe(()=>{
            const { positionInFile, dataProvider } = this.editor.update.desiredState.value;
            const ratio = positionInFile / dataProvider.size;
            scrollPercent = Math.max(0,Math.min(ratio,1));
            const index = this.getIndexFromRatio(scrollPercent, this.editor.update.desiredState.value.dataProvider.size);
            const alignedIndex = this.getRowAlignedIndex(index);
            scrollBar.style.setProperty("--scroll-percent",scrollPercent.toString());
        })
    }
    getScrollTopFromIndex(index: number, documentSize: number){
        const aligned = this.getDocumentBoundIndex(index, documentSize);
        const ratio = this.getRatioFromIndex(aligned, documentSize);
        return ratio * this.editor.dom.innerContainer.scrollHeight;
    }
    getRatioFromIndex(index: number, documentSize: number){
        return index / documentSize;
    }
    getIndexFromRatio(ratio: number, documentSize: number){
        return Math.round(ratio * documentSize);
    }
    getRowAlignedIndex(index: number){
        const rowNumber = Math.floor(index / this.editor.renderer.bytesPerRow);
        const newIndex = rowNumber * this.editor.renderer.bytesPerRow;
        return newIndex;
    }
    getDocumentBoundIndex(index: number, documentSize: number){
        const aligned = this.getRowAlignedIndex(index);
        const min = 0;
        const minBound = Math.max(min,aligned);
        const max = this.getRowAlignedIndex(documentSize) - this.getRowAlignedIndex( ( (this.editor.size.viewportRowCount+2) * this.editor.renderer.bytesPerRow ) / 2 );
        const maxBound = Math.min(minBound,max);
        
        return maxBound;
    }
    changeNativeScrollerPosition(index: number, documentSize: number){
        const top = this.getScrollTopFromIndex(index, documentSize);
        
        this.editor.dom.innerContainer.scrollTo({
            top: top,
            behavior: "instant"
        })
    }
}
