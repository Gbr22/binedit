import { defineSubsystem } from "../composition";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import { Editor } from "../editor";

export const EventHandler = defineSubsystem({
    name: "EventHandler",
    proto: {
        onScroll(this: Editor, fn: (positionInFile: number)=>void): void {
            this.renderedState.subscribe(()=>{
                fn(this.renderedState.value.positionInFile);
            })
        },
        setState(this: Editor, props: { dataProvider: DataProvider, positionInFile: number }): void {
            this.desiredState.value = this.desiredState.value.with({
                positionInFile: props.positionInFile,
                dataProvider: props.dataProvider
            })
        }
    },
});
