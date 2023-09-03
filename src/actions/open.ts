import { TabData } from "@/TabData";
import { openFiles } from "@/openFile";
import { state } from "@/state";
import { switchTab } from "@/tabs";
import type { Action } from "./action";

export const openAction: Action = {
    name: "Open file(s)",
    async fn() {
        const files = await openFiles();
        const tabs = await Promise.all(files.map(file=>TabData.fromFile(file)));
        for (let tab of tabs){
            state.tabs.push(tab);
        }
        const last = tabs.at(-1);
        if (last) {
            switchTab(last);
        }
    },
}