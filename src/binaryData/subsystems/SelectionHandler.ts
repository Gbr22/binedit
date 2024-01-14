import { Editor } from "../editor";
import { defineSubsystem } from "../composition";

export const SelectionHandler = defineSubsystem({
    name: "SelectionHandler",
    init(this: Editor) {
        const cursorPosition = 0;
        const onUpdateCursorListeners = [] as ((cursorPosition: number)=>void)[];
        const selectionStartIndex = undefined as number | undefined;
        const selectionEndIndex = undefined as number | undefined;

        return {
            cursorPosition,
            onUpdateCursorListeners,
            selectionStartIndex,
            selectionEndIndex
        }
    },
    proto: {
        onUpdateCursor(this: Editor, fn: (cursorPosition: number)=>void) {
            this.onUpdateCursorListeners.push(fn);
        },
        onClickByte(this: Editor, index: number, e: MouseEvent) {
            // noop
        },
        onMouseDownByte(this: Editor, index: number, e: MouseEvent) {

        },
        onMouseUpByte(this: Editor, index: number, e: MouseEvent) {
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
            this.onUpdateCursorListeners.forEach(fn=>{
                fn(this.cursorPosition);
            })
            requestAnimationFrame(()=>{
                this.render();
            })
        }
    },
});
