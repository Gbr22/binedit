import { Editor } from "../editor";
import { rowHeight } from "../constants";
import { Subclass } from "../subclass";

export class SizeManager extends Subclass<Editor> {
    viewportRowCount = 0;
    resize(){
        const rect = this.$.dom.element.getBoundingClientRect();
        this.viewportRowCount = Math.floor(rect.height / rowHeight);
        this.$.desiredState.value = this.$.desiredState.value.with({
            width: Math.round(rect.width * window.devicePixelRatio),
            height: Math.round(rect.height * window.devicePixelRatio)
        })
        this.$.reflow();
    }
    constructor(parent: Editor){
        super(parent);
        const resizeObserver = new ResizeObserver((entries) => {
            this.resize();
        });

        resizeObserver.observe(this.$.dom.element);
    }
}
