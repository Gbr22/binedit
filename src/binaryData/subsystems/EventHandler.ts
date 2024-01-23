import { defineSubsystem } from "../composition";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import { Editor } from "../editor";

export const EventHandler = defineSubsystem({
    name: "EventHandler",
    proto: {
        onScroll(this: Editor, fn: (positionInFile: number)=>void): void {
            this.update.renderedState.subscribe(()=>{
                fn(this.update.renderedState.value.positionInFile);
            })
        },
        setState(this: Editor, props: { dataProvider: DataProvider, positionInFile: number }): void {
            this.update.desiredState.value = this.update.desiredState.value.with({
                positionInFile: props.positionInFile,
                dataProvider: props.dataProvider
            })
        }
    },
});
