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
        element: HTMLDivElement
        shadowRoot: ShadowRoot
        innerContainer: HTMLDivElement
    } {
        const element = document.createElement("div");
        const shadowRoot = element.attachShadow({ mode: "closed" });
        const innerContainer = document.createElement("div");
        shadowRoot.appendChild(innerContainer);
        innerContainer.classList.add("container");
        (innerContainer as any).part = "container";
        innerContainer.tabIndex = 0;

        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(getStyles());
        shadowRoot.adoptedStyleSheets.push(styleSheet);

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
            element: element,
            shadowRoot,
            innerContainer
        };
    },
})
