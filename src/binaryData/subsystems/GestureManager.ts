import type { Editor } from "../editor";
import { MouseGestureManager } from "./GestureManager/MouseGestureManager";

export class GestureManager {
    editor: Editor;

    mouse: MouseGestureManager;

    constructor(editor: Editor){
        this.editor = editor;
        this.mouse = new MouseGestureManager(this);
    }
}