import type { Editor, EditorThis } from "../editor";
import styles from "../styles.module.scss";
import { Base, type Constructor, chainImpl } from "../composition";
import { TrackedVar } from "../reactivity";

export function ImplCreateDom<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        element!: HTMLElement
        scrollView!: HTMLElement
        dataView!: HTMLElement

        domRowCount = new TrackedVar(0);
        
        initDomHandler() {
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
        }
    };

    return chainImpl(cls);
}