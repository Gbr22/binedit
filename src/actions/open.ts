import { TabData } from "@/TabData";
import { openFiles } from "@/openFile";
import { state } from "@/state";
import { switchTab } from "@/tabs";
import type { Action } from "./action";

export const openAction: Action = {
    name: "Open file(s)",
    fn() {
        openFiles().then(files=>{
            const tabs = files.map(file=>TabData.fromFile(file));
            for (let tab of tabs){
                state.tabs.push(tab);
            }
            const last = tabs.at(-1);
            if (last) {
                switchTab(last);
            }
        })
    },
}