import styles from "./styles.module.scss";
import { createVirtualScrollBar } from "./virtualScrollbar";

export const container = document.createElement("div");
container.classList.add(styles.container);

export const dataView = document.createElement("div");
dataView.classList.add(styles["data-view"]);
container.appendChild(dataView);

export const scrollView = document.createElement("div");
scrollView.classList.add(styles["scroll-view"]);
container.appendChild(scrollView);

createVirtualScrollBar(container);