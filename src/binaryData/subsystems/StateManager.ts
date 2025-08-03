import type { DataProvider } from "../dataProvider";
import { Editor, type HistoryState } from "../editor";

export class StateManager {
    editor: Editor;
    constructor(editor: Editor){
        this.editor = editor;
    }
    setState(props: { dataProvider: DataProvider, positionInFile?: number, history?: HistoryState }): void {
        const positionInFile = props.positionInFile ?? 0;
        this.editor.data.provider = props.dataProvider;
        if (props.history) {
            this.editor.edit.updateHistory(props.history);
        }
        else {
            this.editor.edit.openDocument(props.dataProvider);
        }
        this.editor.scroll.updateScrollIndex(positionInFile);
        this.editor.scroll.update();
        this.editor.rendering.reflow();
    }
}
