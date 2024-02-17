import type { DataProvider } from "../dataProvider";
import { Editor } from "../editor";

export class StateManager {
    editor: Editor;
    constructor(editor: Editor){
        this.editor = editor;
    }
    setState(props: { dataProvider: DataProvider, positionInFile: number }): void {
        this.editor.data.provider = props.dataProvider;
        this.editor.scroll.updateScrollIndex(props.positionInFile);
        this.editor.scroll.update();
        this.editor.rendering.reflow();
    }
}
