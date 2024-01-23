import type { Editor } from "../editor";
import { KeyboardGestureManager } from "./GestureManager/KeyboardGestureManager";
import { MouseGestureManager } from "./GestureManager/MouseGestureManager";

export class GestureManager {
    editor: Editor;

    mouse: MouseGestureManager;
    keyboard: KeyboardGestureManager;

    constructor(editor: Editor){
        this.editor = editor;
        this.mouse = new MouseGestureManager(this);
        this.keyboard = new KeyboardGestureManager(this);
    }
}