import { Editor } from "../editor";
import { getStyles } from "../styles";
import { Subclass } from "../subclass";

function assert<T>(value: T, message?: string): NonNullable<T> {
    if (value === undefined || value === null){
        throw new Error(`Assert failed: ${message ?? "No message"}`);
    }
    return value;
}

export class DomManager extends Subclass<Editor> {
    element = document.createElement("div");
    canvasContainer = document.createElement("div");
    canvas = document.createElement("canvas");
    ctx = assert(this.canvas.getContext("2d"),"Failed to get canvas context (2d)");
    scrollView = document.createElement("div");
    shadowRoot = this.element.attachShadow({mode: "closed"});
    innerContainer = document.createElement("div");

    constructor(parent: Editor){
        super(parent);
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
