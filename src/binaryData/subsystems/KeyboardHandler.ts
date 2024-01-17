import { Editor } from "../editor";
import { defineSubsystem } from "../composition";

export const KeyboardHandler = defineSubsystem({
    name: "KeyboardHandler",
    init(this: Editor) {
        this.innerContainer.onkeydown = (e)=>{
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
                if (this.selectionHandler.isSelecting() && !e.shiftKey){
                    this.selectionHandler.endSelection();
                    this.redraw();
                } else {
                    if (e.shiftKey){
                        if (!this.selectionHandler.isSelecting()){
                            this.selectionHandler.startSelection("keyboard",this.selectionHandler.cursorPosition,true);
                            this.selectionHandler.onSelectOverByte("keyboard",this.selectionHandler.cursorPosition + diff);
                        } else {
                            this.selectionHandler.onSelectOverByte("keyboard",this.selectionHandler.cursorPosition + diff);
                        }
                        this.redraw();
                    }
                }
                
                this.selectionHandler.setCursor(this.selectionHandler.cursorPosition + diff);
                this.redraw();
                e.preventDefault();
            }
            if (e.code == "Escape"){
                this.selectionHandler.clearSelections();
                e.preventDefault();
            }
        }
    },
    proto: {
        
    },
});
