import { BlobProvider, type DataProvider } from "@/binaryData/dataProvider";
import type { Hover } from "../GestureManager/MouseGestureManager";
import type { Range } from "../SelectionManager";

interface StateDependencies {
    positionInFile: number
    currentHover: Hover
    cursorPosition: number
    selectionRanges: Range[]
    pendingSelectionRanges: Range[]
    dataToRender: Uint8Array
    dataProvider: DataProvider
}

export class State {
    #positionInFile: number = 0;
    get positionInFile() {
        return this.#positionInFile;
    }
    set positionInFile(value) {
        this.#positionInFile = Math.max(value, 0);
    }
    currentHover: Hover;
    cursorPosition: number;
    selectionRanges: Range[];
    pendingSelectionRanges: Range[];
    dataToRender: Uint8Array;
    dataProvider: DataProvider;
    
    constructor(deps: StateDependencies){
        this.positionInFile = deps.positionInFile;
        this.currentHover = deps.currentHover;
        this.cursorPosition = deps.cursorPosition;
        this.selectionRanges = deps.selectionRanges;
        this.pendingSelectionRanges = deps.pendingSelectionRanges;
        this.dataToRender = deps.dataToRender;
        this.dataProvider = deps.dataProvider;
    }

    static empty(){
        return new State({
            positionInFile: 0,
            currentHover: { type: "none" },
            dataProvider: new BlobProvider(new Blob()),
            dataToRender: new Uint8Array(),
            pendingSelectionRanges: [],
            selectionRanges: [],
            cursorPosition: 0
        })
    }
}