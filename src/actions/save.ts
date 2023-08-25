import { state } from "@/state";
import type { Action } from "./action";

export const saveAction: Action = {
    name: "Save file",
    async fn() {
        const filename = state.activeTab?.name;
        const blob = await state.activeTab?.dataSource?.getBlob();
        if (blob && filename){
            const a = document.createElement("a");
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
        }
    },
}