import type { Editor } from "@/binaryData/editor";
import { getCssNumber, getCssString } from "@/theme";
import type { Sizes } from "./sizes";

interface StylesDependencies {
    editor: Editor
    sizes: Sizes
}

export class Styles {
    editor: Editor;

    unit: number;

    editorByteWidth: number;
    editorCharWidth: number;
    minRowNumberDigitCount: number;

    constructor(deps: StylesDependencies){
        this.editor = deps.editor;
        this.unit = deps.sizes.unit;

        this.editorByteWidth = getCssNumber(this.editor.dom.innerContainer,"--editor-byte-width")
        this.editorCharWidth = getCssNumber(this.editor.dom.innerContainer,"--editor-char-width")
        this.minRowNumberDigitCount = getCssNumber(this.editor.dom.innerContainer,"--editor-row-number-digit-count");
    }
    getByteCountFont() {
        return `${getCssNumber(this.editor.dom.innerContainer,"--editor-font-size") * this.unit}px ${getCssString(this.editor.dom.innerContainer,"--editor-font-family")}`
    }
}