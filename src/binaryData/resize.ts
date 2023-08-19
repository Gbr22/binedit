import type { Editor } from "./editor";

export function registerResizeObserver(editor: Editor){
    const resizeObserver = new ResizeObserver((entries) => {
        editor.reflow();
        editor.updateDom();
    });
    
    resizeObserver.observe(editor.element);
}