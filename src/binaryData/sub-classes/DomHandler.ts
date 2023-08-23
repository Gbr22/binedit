import type { Editor, EditorThis } from "../editor";
import styles from "../styles.module.scss";
import { Base, type Constructor, chainImpl } from "../composition";
import { TrackedVar } from "../reactivity";

export function ImplCreateDom<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        element!: HTMLElement
        canvasContainer = document.createElement("div")
        scrollView = document.createElement("div")
        canvas = document.createElement("canvas")
        ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D 

        domRowCount = new TrackedVar(0);
        
        initDomHandler() {
            const that = this as any as EditorThis;
            
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
    };

    return chainImpl(cls);
}