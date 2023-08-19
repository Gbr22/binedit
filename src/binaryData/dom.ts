import type { Editor } from "./editor";
import styles from "./styles.module.scss";
import { createVirtualScrollBar } from "./virtualScrollbar";

export function createDom(editor: Editor){
    const container = document.createElement("div");
    container.classList.add(styles.container);

    const dataView = document.createElement("div");
    dataView.classList.add(styles["data-view"]);
    container.appendChild(dataView);

    const scrollView = document.createElement("div");
    scrollView.classList.add(styles["scroll-view"]);
    container.appendChild(scrollView);

    editor.element = container;
    editor.scrollView = scrollView;
    editor.dataView = dataView;

    createVirtualScrollBar(editor);
}

