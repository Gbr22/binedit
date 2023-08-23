import type { Editor, EditorThis } from "../editor";
import styles from "../styles.module.scss";
import { Base, type Constructor, chainImpl } from "../composition";
import { TrackedVar } from "../reactivity";

export function ImplCreateDom<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        element: HTMLElement = document.createElement("div")
        scrollView!: HTMLElement
        dataView!: HTMLElement
        dataContainer: HTMLElement = document.createElement("div")
        scrollContainer: HTMLElement = document.createElement("div")

        domRowCount = new TrackedVar(0);
        
        initDomHandler() {
            const that = this as any as EditorThis;

            const container = this.element;
            container.classList.add(styles.container);

            this.dataContainer.classList.add(styles["data-container"]);
            container.appendChild(this.dataContainer);

            const dataView = document.createElement("div");
            dataView.classList.add(styles["data-view"]);
            this.dataContainer.appendChild(dataView);

            container.appendChild(this.scrollContainer);
            this.scrollContainer.classList.add(styles["scroll-container"]);

            const scrollView = document.createElement("div");
            scrollView.classList.add(styles["scroll-view"]);
            this.scrollContainer.appendChild(scrollView);

            this.element = container;
            this.scrollView = scrollView;
            this.dataView = dataView;
        }
    };

    return chainImpl(cls);
}