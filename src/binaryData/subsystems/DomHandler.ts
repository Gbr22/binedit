import { Editor } from "../editor";
import styles from "../styles.module.scss";
import { TrackedVar } from "../reactivity";
import { defineSubsystem } from "../composition";

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
        const canvasContainer = document.createElement("div");
        const scrollView = document.createElement("div");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    
        const element = document.createElement("div");
        element.classList.add(styles.container);
    
        scrollView.classList.add(styles["scroll-view"]);
        element.appendChild(scrollView);
    
        canvasContainer.classList.add(styles["canvas-container"]);
        element.appendChild(canvasContainer);
    
        canvas.classList.add(styles["canvas"]);
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
