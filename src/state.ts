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
            tab.scrollPercent = percent;
        }
    },1)
})