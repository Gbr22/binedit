import { state } from "@/state";
import type { Action } from "./action";

export function saveBlob(blob: Blob, filename: string){
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    console.log("save");
}

export const saveAction: Action = {
    name: "Save file",
    async fn() {
        const filename = state.activeTab?.name;
        const blob = await state.activeTab?.dataSource?.getBlob();
        if (blob && filename){
            saveBlob(blob,filename);
        }
    },
}
export const saveAsAction: Action = {
    name: "Save file as",
    async fn() {
        const blob = await state.activeTab?.dataSource?.getBlob();
        if (blob){
            saveBlob(blob,"");
        }
    },
}