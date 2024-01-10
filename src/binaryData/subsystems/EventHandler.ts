import { defineSubsystem, subsystemProps } from "../composition";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import { Editor } from "../editor";
import { getDataProviderRowCount } from "./DataHandler";

export const EventHandler = defineSubsystem({
    name: "EventHandler",
    props: subsystemProps<{}>(),
    proto: {
        onScroll(this: Editor, fn: (scrollPercent: number)=>void): void {
            this.renderedState.subscribe(()=>{
                const topRow = this.renderedState.value.topRow;
                const rowCount = getDataProviderRowCount(this.renderedState.value.dataProvider);
                const percent = topRow / rowCount;
                fn(percent);
            })
        },
        setState(this: Editor, props: { dataProvider: DataProvider, scrollPercent: number }): void {
            const max = props.dataProvider.size || 0;
            const topRow = Math.floor((max * props.scrollPercent) / bytesPerRow);
        
            this.desiredState.value = this.desiredState.value.with({
                topRow,
                dataProvider: props.dataProvider
            })
        }
    },
    init() {
        
    },
});
