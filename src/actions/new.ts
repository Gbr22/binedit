import { TabData } from "@/TabData";
import { BlobProvider } from "@/binaryData/dataProvider";
import { state } from "@/state";
import { switchTab } from "@/tabs";
import type { Action } from "./action";

export const newAction: Action = {
    name: "New file",
    fn() {
        const sizeStr = prompt("File size: ");
        const size = Number(sizeStr);
        if (isNaN(size) || sizeStr == null || sizeStr?.trim() == ""){
            return;
        }
        const dataProvider = new BlobProvider(new Blob([new ArrayBuffer(size)]));
        const tab = new TabData("Untitled",dataProvider);
        state.tabs.push(tab);
        switchTab(tab);
    },
}