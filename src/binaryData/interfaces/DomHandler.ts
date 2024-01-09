import { Editor } from "../editor";
import styles from "../styles.module.scss";
import { TrackedVar } from "../reactivity";

export interface IDomHandler {
    element: HTMLElement
    canvasContainer: HTMLDivElement
    scrollView: HTMLDivElement
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    domRowCount: TrackedVar<number>

    initDomHandler: ()=>void
}

export function patchDomHandler(){
    Editor.prototype.initDomHandler = function(){
        this.canvasContainer = document.createElement("div")
        this.scrollView = document.createElement("div")
        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D 
        this.domRowCount = new TrackedVar(0);
    
        const container = document.createElement("div");
        container.classList.add(styles.container);
    
        const scrollView = this.scrollView;
        scrollView.classList.add(styles["scroll-view"]);
        container.appendChild(scrollView);
    
        this.canvasContainer.classList.add(styles["canvas-container"]);
        container.appendChild(this.canvasContainer);
    
        this.canvas.classList.add(styles["canvas"]);
        this.canvasContainer.appendChild(this.canvas);
    
        this.element = container;
        this.scrollView = scrollView;
    }
}