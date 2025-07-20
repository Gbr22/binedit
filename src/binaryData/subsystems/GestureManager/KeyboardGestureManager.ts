import type { GestureManager } from "../GestureManager";

export class KeyboardGestureManager {
    manager: GestureManager;
    get editor(){
        return this.manager.editor;
    }

    constructor(manager: GestureManager){
        this.manager = manager;

        this.editor.dom.innerContainer.onkeydown = (e)=>{
            if (!this.editor.dom.isFocused) {
                return;
            }
            let cursorByteDiff = 0;
            let scrollByteDiff = 0;
            {
                const cursorMove = {
                    x: 0,
                    y: 0,
                }
                if (e.code == "ArrowUp"){
                    cursorMove.y = -1;
                }
                if (e.code == "ArrowDown"){
                    cursorMove.y = 1;
                }
                if (e.code == "ArrowLeft"){
                    cursorMove.x = -1;
                }
                if (e.code == "ArrowRight"){
                    cursorMove.x = 1;
                }
                cursorByteDiff = cursorMove.y * this.editor.rendering.layout.bytesPerRow + cursorMove.x;
            }
            if (e.code == "PageUp" || e.code == "PageDown"){
                const dir = e.code == "PageUp" ? -1 : 1;
                const byteDiff = dir * this.editor.rendering.layout.viewportRowCount * this.editor.rendering.layout.bytesPerRow;
                cursorByteDiff = byteDiff;
                scrollByteDiff = byteDiff;
            }
            if (e.code == "Home" || e.code == "End"){
                const currentCursorPosition = this.editor.selection.cursorPosition;
                const currentScrollPosition = this.editor.scroll.positionInFile;
                let newPosition = currentCursorPosition;
                if (e.code == "Home") {
                    newPosition = 0;
                }
                else if (e.code == "End") {
                    newPosition = this.editor.data.provider.size - 1;
                }
                cursorByteDiff = newPosition - currentCursorPosition;
                scrollByteDiff = newPosition - currentScrollPosition;
            }
            if (cursorByteDiff != 0){
                if (this.editor.selection.isSelecting() && !e.shiftKey){
                    this.editor.selection.endRange();
                } else {
                    if (e.shiftKey){
                        if (!this.editor.selection.isSelecting()){
                            this.editor.selection.startRange("keyboard",this.editor.selection.cursorPosition, true);
                            this.editor.selection.hoverOverByte("keyboard",this.editor.selection.cursorPosition + cursorByteDiff);
                        } else {
                            this.editor.selection.hoverOverByte("keyboard",this.editor.selection.cursorPosition + cursorByteDiff);
                        }
                    }
                }
                this.editor.scroll.updateScrollIndex(this.editor.scroll.positionInFile + scrollByteDiff);
                this.editor.selection.setCursor(this.editor.selection.cursorPosition + cursorByteDiff);
                this.editor.rendering.redraw();
                e.preventDefault();
            }
            if (e.code == "Escape"){
                this.editor.selection.clearRanges();
                this.editor.rendering.redraw();
                e.preventDefault();
            }
        }
    }
}
