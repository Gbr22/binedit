import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomManager";
import { StateManager } from "./subsystems/StateManager";
import { ScrollManager } from "./subsystems/ScrollManager";
import { RenderingManager } from "./subsystems/RenderingManager";
import { GestureManager } from "./subsystems/GestureManager";
import { DataManager } from "./subsystems/DataManager";
import { SelectionManager } from "./subsystems/SelectionManager";
import { EditManager, HistoryChangeEvent, type HistoryItem } from "./subsystems/EditManager";
import { disposeChildren } from "./dispose";

export { HistoryChangeEvent };

export interface HistoryState {
    get entryPointer(): number;
    get entries(): HistoryItem[];
};

export class Editor implements Disposable {
    data = new DataManager(this);
    event = new StateManager(this);
    selection = new SelectionManager(this);
    dom = new DomManager(this);
    size = new SizeManager(this);
    rendering = new RenderingManager(this);
    scroll = new ScrollManager(this);
    gesture = new GestureManager(this);
    edit = new EditManager(this);

    history;

    constructor(){
        const editor = this;

        class HistoryClass extends EventTarget implements HistoryState {
            get entryPointer() {
                return editor.edit.historyStackPointer;
            }
            set entryPointer(value: number) {
                editor.edit.historyStackPointer = value;
            }
            get entries() {
                return editor.edit.historyStack;
            }
            constructor() {
                super();
            }
        }

        this.history = new HistoryClass();
    }

    transaction(fn: () => void): void {
        this.edit.transaction(()=>fn());
    }

    /**
     * Deletes bytes from the document.
     * @param from Start deletion from this index (inclusive).
     * @param to End of deletion range (exclusive).
     */
    deleteRange(from: number, to: number): void {
        this.edit.deleteRange(from, to);
    }

    /**
     * Deletes count bytes from the document starting from index.
     * @param index Delete at this index.
     * @param count The number of bytes to delete.
     */
    deleteAt(index: number, count: number = 1): void {
        this.edit.deleteAt(index, count);
    }

    [Symbol.dispose] = disposeChildren.bind(null,this)
}
