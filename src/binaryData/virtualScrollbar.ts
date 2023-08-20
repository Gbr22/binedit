import styles from "./styles.module.scss";
import upIcon from '@/assets/icons/chevron-up.svg?raw';
import downIcon from '@/assets/icons/chevron-down.svg?raw';
import type { Editor } from "./editor";

interface ScrollStart {
    y: number
    scrollPercent: number
}

export function createVirtualScrollBar(editor: Editor){
    const scrollBar = document.createElement("div");
    scrollBar.classList.add(styles["scroll-bar"]);
    editor.element.appendChild(scrollBar);

    const upArrow = document.createElement("button");
    upArrow.classList.add(styles["up-arrow"]);
    upArrow.innerHTML = upIcon;

    const downArrow = document.createElement("button");
    downArrow.classList.add(styles["down-arrow"]);
    downArrow.innerHTML = downIcon;

    const scrollBarTrack = document.createElement("div");
    scrollBarTrack.classList.add(styles["scroll-bar-track"]);
    const scrollBarTrackPadding = document.createElement("div");
    scrollBarTrackPadding.classList.add(styles["scroll-bar-track-padding"]);

    scrollBar.appendChild(upArrow);
    scrollBar.appendChild(scrollBarTrack);
    scrollBar.appendChild(scrollBarTrackPadding);
    scrollBar.appendChild(downArrow);

    const scrollBarHandle = document.createElement("button");
    scrollBarHandle.classList.add(styles["scroll-bar-handle"]);
    scrollBarTrack.appendChild(scrollBarHandle);

    let scrollStart: ScrollStart | null = null;
    let scrollPercent = 0;
    scrollBarHandle.addEventListener("mousedown",(e)=>{
        scrollStart = {
            y: e.clientY,
            scrollPercent
        };
    })
    window.addEventListener("mousemove",(e)=>{
        if (!scrollStart){
            return;
        }
        const diff = e.clientY - scrollStart.y;
        const height = scrollBarTrack.clientHeight;
        const percent = diff/height + scrollStart.scrollPercent;
        scrollPercent = Math.max(0,Math.min(percent,1));
        editor.topRow.value = Math.ceil(editor.fileRowCount.value * scrollPercent);
        scrollBar.style.setProperty("--scroll-percent",scrollPercent.toString());
    })
    window.addEventListener("mouseup",()=>{
        scrollStart = null;
    })
}