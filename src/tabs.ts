import type { TabData } from "./TabData";
import { BlobProvider } from "./binaryData/dataProvider";
import { editor, state } from "./state";

export function switchTab(tab: TabData | undefined){
    state.activeTab = tab;
    if (tab){
        editor.cursorPosition = tab.cursorPosition;
        editor.selections = tab.selections;
        editor.setState({
            dataProvider: tab.dataSource,
            scrollPercent: tab.scrollPercent,
        });
    } else {
        editor.setState({
            dataProvider: new BlobProvider(new Blob([])),
            scrollPercent: 0
        });
        editor.cursorPosition = 0;
    }
}
export function closeTab(file: TabData){
    const index = state.tabs.findIndex(e=>e === file);
    state.tabs.splice(index,1);
    if (file == state.activeTab){
        let switchTo: TabData | undefined;
        if (index == state.tabs.length){
            switchTo = state.tabs.at(-1);
        } else {
            switchTo = state.tabs.at(index);
        }
        state.activeTab = switchTo;
        requestAnimationFrame(()=>{
            switchTab(switchTo);
        })
    }
}
