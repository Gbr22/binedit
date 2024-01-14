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
    } {
        const element = document.createElement("div");
        element.classList.add("editor");

        const styleEl = document.createElement("style");
        styleEl.innerHTML = getStyles();
        element.appendChild(styleEl);

        const canvasContainer = document.createElement("div");
        const scrollView = document.createElement("div");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    
        scrollView.classList.add("scroll-view");
        element.appendChild(scrollView);
    
        canvasContainer.classList.add("canvas-container");
        element.appendChild(canvasContainer);
    
        canvas.classList.add("canvas");
        canvasContainer.appendChild(canvas);

        return {
            domRowCount: new TrackedVar(0),
            canvasContainer,
            canvas,
            ctx,
            scrollView,
            element
        };
    },
})
