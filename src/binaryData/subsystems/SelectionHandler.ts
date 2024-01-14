import { Editor } from "../editor";
import { defineSubsystem } from "../composition";
import { TrackedVar } from "../reactivity";

export const SelectionHandler = defineSubsystem({
    name: "SelectionHandler",
    init(this: Editor) {
        const cursorPosition = 0;

        return {
            cursorPosition
        }
    },
    proto: {
        onSelectByte(this: Editor, index: number){
            this.setCursor(index);  
        },
        setCursor(this: Editor, index: number, clampToBounds?: true) {
            let clampedIndex = index;
            if (clampedIndex < 0){
                clampedIndex = 0;
            }
            if (clampedIndex >= this.intermediateState.value.dataProvider.size) {
                clampedIndex = this.intermediateState.value.dataProvider.size - 1;
            }
            if (clampedIndex != index && !clampToBounds) {
                return;
            }
            const prev = this.cursorPosition;
            this.cursorPosition = clampedIndex;
            if (this.cursorPosition == prev) {
                return;
            }
            requestAnimationFrame(()=>{
                this.render();
            })
        }
    },
});
