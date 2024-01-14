import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { defineSubsystem } from "../composition";
import { getStyles } from "../styles";

export const DomHandler = defineSubsystem({
    name: "DomHandler",
    proto: {},
    init(this: Editor): {
        domRowCount: TrackedVar<number>
        canvasContainer: HTMLDivElement
        canvas: HTMLCanvasElement
        ctx: CanvasRenderingContext2D
        scrollView: HTMLDivElement
        element: HTMLElement
        shadowRoot: ShadowRoot
        shadowContainer: HTMLDivElement
        innerContainer: HTMLDivElement
    } {
        const element = document.createElement("div");
        element.classList.add("editor");

        const shadowContainer = document.createElement("div");
        shadowContainer.classList.add("shadow-container");
        shadowContainer.style.width = "100%";
        shadowContainer.style.height = "100%";
        shadowContainer.style.maxWidth = "100%";
        shadowContainer.style.maxHeight = "100%";
        const shadowRoot = shadowContainer.attachShadow({ mode: "closed" });
        element.appendChild(shadowContainer);
        const innerContainer = document.createElement("div");
        shadowRoot.appendChild(innerContainer);
        innerContainer.classList.add("container");

        const styleEl = document.createElement("style");
        styleEl.innerHTML = getStyles();
        shadowRoot.appendChild(styleEl);

        const canvasContainer = document.createElement("div");
        const scrollView = document.createElement("div");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    
        scrollView.classList.add("scroll-view");
        innerContainer.appendChild(scrollView);
    
        canvasContainer.classList.add("canvas-container");
        innerContainer.appendChild(canvasContainer);
    
        canvas.classList.add("canvas");
        canvasContainer.appendChild(canvas);

        return {
            domRowCount: new TrackedVar(0),
            canvasContainer,
            canvas,
            ctx,
            scrollView,
            element,
            shadowContainer,
            shadowRoot,
            innerContainer
        };
    },
})
