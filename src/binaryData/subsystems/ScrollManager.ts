import { Editor } from "../editor";
import { rowHeight } from "../constants";
import { getDataProviderRowCount } from "./DataManager";

export class ScrollManager {
    editor: Editor

    virtualScrollbar = document.createElement("div");
    nativeScrollerRowLimit = 10000;
    #positionInFile: number = 0;
    get positionInFile(): number {
        return this.#positionInFile;
    }
    set positionInFile(value: number) {
        this.#positionInFile = Math.max(value, 0);
    }

    onScrollHandlers: ((positionInFile: number)=>void)[] = [];
    onScroll(fn: (positionInFile: number)=>void): void {
        this.onScrollHandlers.push(fn);
    }
    triggerScrollHandlers(positionInFile: number){
        for (const fn of this.onScrollHandlers) {
            fn(positionInFile);
        }
    }

    get scrollRowCount(){
        return Math.min(this.nativeScrollerRowLimit, getDataProviderRowCount(this.editor.data.provider));
    }
    get scrollbarType(){
        if (getDataProviderRowCount(this.editor.data.provider) > this.nativeScrollerRowLimit){
            return "virtual";
        }
        return "native";
    }

    constructor(editor: Editor){
        this.editor = editor;
        this.positionInFile = 0;
        
        this.editor.dom.innerContainer.addEventListener("scroll",()=>{
            if (this.scrollbarType != "native"){
                return;
            }
            const ratio = this.editor.dom.innerContainer.scrollTop / ( this.editor.dom.innerContainer.scrollHeight - (this.editor.dom.innerContainer.clientHeight / 2) );
            this.updateScrollRatio(ratio);
            this.editor.rendering.redraw();
        },{passive: true})
    
        this.editor.dom.innerContainer.addEventListener("wheel",(e)=>{
            if (this.scrollbarType == "native"){
                return;
            }
            const delta = e.deltaY;
            const deltaRow = Math.round(delta / rowHeight);
            const newIndex = this.positionInFile + deltaRow * this.editor.rendering.layout.bytesPerRow;
            this.updateScrollIndex(newIndex);
            this.editor.rendering.redraw();
        },{passive: true});
    
        this.createVirtualScrollBar();
        this.update();
    }
    update(){
        this.editor.dom.innerContainer.dataset["scrollType"] = this.scrollbarType;
        this.editor.dom.scrollView.style.setProperty('--row-count',this.scrollRowCount.toString());

        if (this.scrollbarType == "native"){
            this.changeNativeScrollerPosition(this.positionInFile);
        } else {
            this.changeNativeScrollerPosition(0);
        }
    }
    updateScrollIndex(index: number){
        const documentSize = this.editor.data.provider.size;
        const boundIndex = this.getDocumentBoundIndex(index, documentSize);
        if (this.positionInFile === boundIndex){
            return;
        }
        this.positionInFile = boundIndex;
        this.editor.gesture.mouse.forceUpdateHover();
        const ratio = boundIndex / (this.editor.data.provider.size-1);
        this.virtualScrollbar.style.setProperty("--scroll-percent",String(ratio));
        this.triggerScrollHandlers(this.positionInFile);
    }
    updateScrollRatio(ratio: number){
        const documentSize = this.editor.data.provider.size;
        const boundRatio = Math.max(0,Math.min(ratio,1));
        const index = this.getIndexFromRatio(boundRatio, documentSize);
        this.updateScrollIndex(index);
    }
    createVirtualScrollBar(): void {
        const scrollbar = this.virtualScrollbar;
        scrollbar.classList.add("scrollbar");
        (scrollbar as any).part = "scrollbar";
        this.editor.dom.innerContainer.appendChild(scrollbar);
    
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
    
        scrollbar.appendChild(upButton);
        scrollbar.appendChild(scrollBarHandleContainer);
        scrollbar.appendChild(scrollBarTrackPadding);
        scrollbar.appendChild(downButton);
    
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
        scrollBarHandle.addEventListener("mousedown",(e)=>{
            if (scrollStart) {
                return;
            }
            const scrollRatio = this.editor.scroll.positionInFile / (this.editor.data.provider.size);
            scrollStart = {
                y: e.clientY,
                scrollRatio
            };
        })
        window.addEventListener("mousemove",(e)=>{
            if (!scrollStart){
                return;
            }
            const diff = e.clientY - scrollStart.y;
            const height = scrollBarHandleContainer.clientHeight;
            const ratio = diff / height + scrollStart.scrollRatio;
            this.updateScrollRatio(ratio);
            this.editor.rendering.redraw();
        })
        window.addEventListener("mouseup",()=>{
            scrollStart = null;
        })
    
        const step = (dir: 1 | -1)=>{
            const newPosition = this.positionInFile + dir * this.editor.rendering.layout.bytesPerRow;
            this.updateScrollIndex(newPosition);
            this.editor.rendering.redraw();
        }
    
        upButton.onclick = ()=>{
            step(-1);
        }
        downButton.onclick = ()=>{
            step(1);
        }
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
        const rowNumber = Math.floor(index / this.editor.rendering.layout.bytesPerRow);
        const newIndex = rowNumber * this.editor.rendering.layout.bytesPerRow;
        return newIndex;
    }
    getDocumentBoundIndex(index: number, documentSize: number){
        const aligned = this.getRowAlignedIndex(index);
        const min = 0;
        const minBound = Math.max(min,aligned);
        const max = this.getRowAlignedIndex(documentSize-1) - this.getRowAlignedIndex( ( (this.editor.size.viewportRowCount+2) * this.editor.rendering.layout.bytesPerRow ) / 2 );
        const maxBound = Math.min(minBound,max);
        
        return maxBound;
    }
    changeNativeScrollerPosition(index: number){
        const documentSize = this.editor.data.provider.size;
        const top = this.getScrollTopFromIndex(index, documentSize);
        
        this.editor.dom.innerContainer.scrollTo({
            top: top,
            behavior: "instant"
        })
    }
}
