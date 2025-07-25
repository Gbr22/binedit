import { Editor } from "../editor";
import { getStyles } from "../styles";

function assert<T>(value: T, message?: string): NonNullable<T> {
    if (value === undefined || value === null){
        throw new Error(`Assert failed: ${message ?? "No message"}`);
    }
    return value;
}

export class DomManager {
    element = document.createElement("div");
    canvasContainer = document.createElement("div");
    canvas = document.createElement("canvas");
    ctx = assert(this.canvas.getContext("2d"),"Failed to get canvas context (2d)");
    scrollView = document.createElement("div");
    shadowRoot = this.element.attachShadow({mode: "closed"});
    innerContainer = document.createElement("div");

    editor: Editor;

    get isFocused() {
        return document.activeElement == this.element && this.shadowRoot.activeElement == this.innerContainer;
    }

    constructor(editor: Editor){
        this.editor = editor;
        this.shadowRoot.appendChild(this.innerContainer);
        this.innerContainer.classList.add("container");
        (this.innerContainer as any).part = "container";
        this.innerContainer.tabIndex = 0;

        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(getStyles());
        this.shadowRoot.adoptedStyleSheets.push(styleSheet);

    
        this.scrollView.classList.add("scroll-view");
        this.innerContainer.appendChild(this.scrollView);
    
        this.canvasContainer.classList.add("canvas-container");
        this.innerContainer.appendChild(this.canvasContainer);
    
        this.canvas.classList.add("canvas");
        this.canvasContainer.appendChild(this.canvas);
    }
}
