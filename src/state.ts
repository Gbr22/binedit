import { reactive, shallowReactive } from "vue";
import type { TabData } from "./TabData";
import { Editor, HistoryChangeEvent } from "./binaryData/editor";

export const editor = new Editor();

export const state = reactive({
    tabs: [] as TabData[],
    activeTab: undefined as TabData | undefined,
});

editor.history.addEventListener("historychange", (event) => {
    if (!event || !(event instanceof HistoryChangeEvent)) {
        return;
    }
    const tab = state.activeTab;
    if (!tab) {
        return;
    }
    tab.history = shallowReactive(event.detail.history);
});

editor.scroll.onScroll(positionInFile=>{
    const tab = state.activeTab;
    setTimeout(()=>{
        if (tab){
            tab.positionInFile = positionInFile;
        }
    },1)
})
editor.selection.onUpdateCursor(pos=>{
    const tab = state.activeTab;
    if (!tab){
        return;
    }
    tab.cursorPosition = pos;
})

editor.selection.onUpdateRanges(selections=>{
    const tab = state.activeTab;
    if (!tab){
        return;
    }
    tab.selections = selections;
})