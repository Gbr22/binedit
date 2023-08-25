import type { TabData } from "./TabData";
import { BlobProvider } from "./binaryData/dataProvider";
import { editor, state } from "./state";

export function switchTab(tab: TabData | undefined){
    state.activeTab = tab;
    if (tab){
        editor.setState({
            dataProvider: tab.dataSource,
            scrollPercent: tab.scrollPercent
        });
    } else {
        editor.setState({
            dataProvider: new BlobProvider(new Blob([])),
            scrollPercent: 0
        });
    }
}