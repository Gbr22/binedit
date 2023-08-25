import { state } from "@/state";
import { closeTab } from "@/tabs";
import type { Action } from "./action";

export const closeTabAction: Action = {
    name: "Close Tab",
    fn() {
        if (state.activeTab){
            closeTab(state.activeTab);
        }
    },
}