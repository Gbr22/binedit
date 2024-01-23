import type { Editor } from "@/binaryData/editor";
import { getCssBoolean, getCssNumber, getCssString } from "@/theme";
import type { Sizes } from "./sizes";

interface StylesDependencies {
    editor: Editor
    sizes: Sizes
}

interface SColor {
    color: string
}

export class Styles {
    #editor: Editor;

    unit: number;

    showWireframe: boolean;
    byteCount: {
        font: string
        minDigitCount: number
        color: string
    }
    byteCountContainer: {
        borderColor: string
        backgroundColor: string
    }
    byte: {
        width: number
        font: string
    }
    byteOdd: {
        color: string
    }
    byteEven: {
        color: string
    }
    char: {
        width: number
        font: string
    }
    charType: {
        [k: string]: SColor
    }
    charsContainer: {
        borderColor: string
        backgroundColor: string
    }
    editor: {
        backgroundColor: string
    }
    hover: {
        borderColor: string
        borderWidth: number
    }
    cursor: {
        borderColor: string
        borderWidth: number
    }
    selection: {
        backgroundColor: string
    }

    constructor(deps: StylesDependencies){
        this.#editor = deps.editor;
        this.unit = deps.sizes.unit;

        this.byte = {
            width: getCssNumber(
                this.#editor.dom.innerContainer,
                "--editor-byte-width"
            ),
            font: `${getCssNumber(
                this.#editor.dom.innerContainer,
                "--editor-font-size"
            ) * this.unit}px ${getCssString(
                this.#editor.dom.innerContainer,
                "--editor-font-family"
            )}`
        }
        this.char = {
            width: getCssNumber(
                this.#editor.dom.innerContainer,
                "--editor-char-width"
            ),
            font: `${getCssNumber(
                this.#editor.dom.innerContainer,
                "--editor-font-size"
            ) * this.unit}px ${getCssString(
                this.#editor.dom.innerContainer,
                "--editor-font-family"
            )}`
        }
        this.showWireframe = getCssBoolean(this.#editor.dom.element,"--editor-show-wireframe")
        this.byteCount = {
            font: `${getCssNumber(this.#editor.dom.innerContainer,"--editor-font-size") * this.unit}px ${getCssString(this.#editor.dom.innerContainer,"--editor-font-family")}`,
            minDigitCount: getCssNumber(this.#editor.dom.innerContainer,"--editor-row-number-digit-count"),
            color: getCssString(this.#editor.dom.innerContainer,"--editor-row-number-foreground-color"),
        }
        this.editor = {
            backgroundColor: getCssString(this.#editor.dom.innerContainer,"--editor-background-color")
        }
        this.byteEven = {
            color: getCssString(this.#editor.dom.innerContainer,"--editor-byte-1-foreground-color"),
        }
        this.byteOdd = {
            color: getCssString(this.#editor.dom.innerContainer,"--editor-byte-2-foreground-color"),
        }
        this.byteCountContainer = {
            borderColor: getCssString(
                this.#editor.dom.innerContainer,
                "--editor-border-color"
            ),
            backgroundColor: getCssString(
                this.#editor.dom.innerContainer,
                "--editor-row-number-background-color"
            ),
        }
        this.charsContainer = {
            borderColor: getCssString(
                this.#editor.dom.innerContainer,
                "--editor-border-color"
            ),
            backgroundColor: getCssString(
                this.#editor.dom.innerContainer,
                "--editor-background-color"
            )
        }
        this.hover = {
            borderColor: getCssString(
                this.#editor.dom.innerContainer,
                "--editor-select-border-color"
            ),
            borderWidth: 1
        }
        this.cursor = {
            borderColor: getCssString(
                this.#editor.dom.innerContainer,
                "--editor-cursor-border-color"
            ),
            borderWidth: 1
        }
        this.selection = {
            backgroundColor: getCssString(
                this.#editor.dom.innerContainer,
                "--editor-cursor-background-color"
            )
        }
        this.charType = Object.fromEntries((["ascii","control","other"] as const).map(key=>{
            const color = getCssString(
                this.#editor.dom.innerContainer,
                `--editor-char-${key}-color`
            );
            const value = {
                color
            }
            return [key,value];
        }));
    }
}