import { Editor } from "../editor";
import { defineSubsystem } from "../composition";

export const KeyboardHandler = defineSubsystem({
    name: "KeyboardHandler",
    init(this: Editor) {
        this.dom.innerContainer.onkeydown = (e)=>{
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
            const diff = dir.y * this.bytesPerRow + dir.x;
            if (diff != 0){
                if (this.selection.isSelecting() && !e.shiftKey){
                    this.selection.endRange();
                    this.redraw();
                } else {
                    if (e.shiftKey){
                        if (!this.selection.isSelecting()){
                            this.selection.startRange("keyboard",this.selection.cursorPosition,true);
                            this.selection.hoverOverByte("keyboard",this.selection.cursorPosition + diff);
                        } else {
                            this.selection.hoverOverByte("keyboard",this.selection.cursorPosition + diff);
                        }
                        this.redraw();
                    }
                }
                
                this.selection.setCursor(this.selection.cursorPosition + diff);
                this.redraw();
                e.preventDefault();
            }
            if (e.code == "Escape"){
                this.selection.clearRanges();
                e.preventDefault();
            }
        }
    },
    proto: {
        
    },
});
