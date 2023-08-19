import type { Editor, EditorThis } from "../editor";
import styles from "../styles.module.scss";
import { createVirtualScrollBar } from "../virtualScrollbar";
import { Base, type Constructor, chainImpl } from "../composition";

export interface ICreateDom {
    element: HTMLElement
    scrollView: HTMLElement
    dataView: HTMLElement
    createDom: ()=>void
}

export function ImplCreateDom<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor implements ICreateDom {
        element!: HTMLElement
        scrollView!: HTMLElement
        dataView!: HTMLElement
        
        public createDom() {
            const that = this as any as EditorThis;
            const container = document.createElement("div");
            container.classList.add(styles.container);

            const dataView = document.createElement("div");
            dataView.classList.add(styles["data-view"]);
            container.appendChild(dataView);

            const scrollView = document.createElement("div");
            scrollView.classList.add(styles["scroll-view"]);
            container.appendChild(scrollView);

            this.element = container;
            this.scrollView = scrollView;
            this.dataView = dataView;

            createVirtualScrollBar(that);
        }
    };

    return chainImpl(cls);
}