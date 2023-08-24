import type { TabData } from "./TabData";
import { editor, state } from "./state";

export function switchTab(tab: TabData){
    state.activeTab = tab;
    editor.setState({
        dataProvider: tab.dataSource,
        scrollPercent: tab.scrollPercent
    });
}