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
                this.setCursor(this.cursorPosition + diff);
                e.preventDefault();
            }
        }
    },
    proto: {
        
    },
});
