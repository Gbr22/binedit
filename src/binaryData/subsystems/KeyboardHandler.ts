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
                if (this.isSelecting() && !e.shiftKey){
                    this.endSelection();
                } else {
                    if (e.shiftKey){
                        if (!this.isSelecting()){
                            this.startSelection("keyboard",this.cursorPosition,true);
                            this.onSelectOverByte("keyboard",this.cursorPosition + diff);
                        } else {
                            this.onSelectOverByte("keyboard",this.cursorPosition + diff);
                        }
                    }
                }
                
                this.setCursor(this.cursorPosition + diff);
                this.redraw();
                e.preventDefault();
            }
            if (e.code == "Escape"){
                this.clearSelections();
                e.preventDefault();
            }
        }
    },
    proto: {
        
    },
});
