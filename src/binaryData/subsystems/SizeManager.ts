import { Editor } from "../editor";
import { rowHeight } from "../constants";

export class SizeManager {
    viewportRowCount = 0;
    editor: Editor;
    resize(){
        const rect = this.editor.dom.element.getBoundingClientRect();
        this.viewportRowCount = Math.floor(rect.height / rowHeight) + 1;
        this.editor.update.desiredState.value = this.editor.update.desiredState.value.with({
            width: Math.round(rect.width * window.devicePixelRatio),
            height: Math.round(rect.height * window.devicePixelRatio)
        })
        this.editor.renderer.reflow();
    }
    constructor(parent: Editor){
        this.editor = parent;
        const resizeObserver = new ResizeObserver((entries) => {
            this.resize();
        });

        resizeObserver.observe(this.editor.dom.element);
    }
}
