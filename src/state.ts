import { reactive } from "vue";
import type { TabData } from "./TabData";
import { Editor } from "./binaryData/editor";

export const editor = new Editor();

export const state = reactive({
    tabs: [] as TabData[],
    activeTab: undefined as TabData | undefined,
})

editor.onScroll(percent=>{
    const tab = state.activeTab;
    setTimeout(()=>{
        if (tab){
            tab.positionInFile = percent;
        }
    },1)
})
editor.selectionHandler.onUpdateCursor(pos=>{
    const tab = state.activeTab;
    if (!tab){
        return;
    }
    tab.cursorPosition = pos;
})
editor.selectionHandler.onUpdateSelections(selections=>{
    const tab = state.activeTab;
    if (!tab){
        return;
    }
    tab.selections = selections;
})