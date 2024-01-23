import { defineSubsystem } from "../composition";
import type { DataProvider } from "../dataProvider";
import { Editor } from "../editor";

export class EventManager {
    editor: Editor;
    constructor(editor: Editor){
        this.editor = editor;
    }
    onScroll(fn: (positionInFile: number)=>void): void {
        this.editor.update.renderedState.subscribe(()=>{
            fn(this.editor.update.renderedState.value.positionInFile);
        })
    }
    setState(props: { dataProvider: DataProvider, positionInFile: number }): void {
        this.editor.update.desiredState.value = this.editor.update.desiredState.value.with({
            positionInFile: props.positionInFile,
            dataProvider: props.dataProvider
        })
    }
}
