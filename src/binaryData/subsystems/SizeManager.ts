import { Editor } from "../editor";
import { rowHeight } from "../constants";

export class SizeManager {
    editor: Editor;

    viewportRowCount = 0;
    
    width: number;
    height: number;

    resize(){
        const rect = this.editor.dom.element.getBoundingClientRect();
        this.viewportRowCount = Math.floor(rect.height / rowHeight) + 1;
        
        this.width = Math.round(rect.width * window.devicePixelRatio),
        this.height = Math.round(rect.height * window.devicePixelRatio)
    }
    constructor(parent: Editor){
        this.editor = parent;

        this.width = 0;
        this.height = 0;

        this.resize();

        const resizeObserver = new ResizeObserver((entries) => {
            this.resize();
            this.editor.rendering.reflow();
        });

        resizeObserver.observe(this.editor.dom.element);
    }
}
