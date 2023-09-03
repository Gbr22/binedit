import { state } from "@/state";
import type { Action } from "./action";
import { FileHandleProvider, type DataProvider } from "@/binaryData/dataProvider";

export function saveBlob(blob: Blob, filename: string){
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
}

export async function saveFile(provider: DataProvider, filename: string){
    if (provider instanceof FileHandleProvider){
        await provider.makeWritable();
    } else {
        const blob = await provider.getBlob();
        return saveBlob(blob, filename);
    }
}
export async function saveFileAs(provider: DataProvider, filename: string) {
    const blob = await provider.getBlob();
        return saveBlob(blob, "");
}

export const saveAction: Action = {
    name: "Save file",
    async fn() {
        const filename = state.activeTab?.name;
        const source = await state.activeTab?.dataSource;
        if (source && filename){
            saveFile(source,filename);
        }
    },
}
export const saveAsAction: Action = {
    name: "Save file as",
    async fn() {
        const source = await state.activeTab?.dataSource;
        if (source){
            saveFileAs(source,"");
        }
    },
}