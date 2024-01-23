import type { GestureManager } from "../GestureManager";

export class KeyboardGestureManager {
    manager: GestureManager;
    get editor(){
        return this.manager.editor;
    }

    constructor(manager: GestureManager){
        this.manager = manager;

        this.editor.dom.innerContainer.onkeydown = (e)=>{
            const dir = {
                x: 0,
                y: 0,
            }
            if (e.code == "ArrowUp"){
                dir.y = -1;
            }
            if (e.code == "ArrowDown"){
                dir.y = 1;
            }
            if (e.code == "ArrowLeft"){
                dir.x = -1;
            }
            if (e.code == "ArrowRight"){
                dir.x = 1;
            }
            const diff = dir.y * this.editor.rendering.layout.bytesPerRow + dir.x;
            if (diff != 0){
                if (this.editor.selection.isSelecting() && !e.shiftKey){
                    this.editor.selection.endRange();
                    this.editor.rendering.redraw();
                } else {
                    if (e.shiftKey){
                        if (!this.editor.selection.isSelecting()){
                            this.editor.selection.startRange("keyboard",this.editor.selection.cursorPosition,true);
                            this.editor.selection.hoverOverByte("keyboard",this.editor.selection.cursorPosition + diff);
                        } else {
                            this.editor.selection.hoverOverByte("keyboard",this.editor.selection.cursorPosition + diff);
                        }
                        this.editor.rendering.redraw();
                    }
                }
                
                this.editor.selection.setCursor(this.editor.selection.cursorPosition + diff);
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
