import type { DataProvider } from "../dataProvider";
import { assertConsistency, deleteRanges, sliceRanges, WrappedDataProvider, type RangeSource } from "../editing/editing";
import type { Editor, HistoryState } from "../editor";

const deleteChange = Symbol.for("x/binedit/change/delete");
const modify = Symbol.for("x/binedit/change/modify");
const insert = Symbol.for("x/binedit/change/insert");
const open = Symbol.for("x/binedit/change/open");

export const ChangeTypes = Object.freeze({
    delete: deleteChange,
    modify,
    insert,
    open,
});
export type ChangeTypes = typeof ChangeTypes;
export type ChangeType = ChangeTypes[keyof ChangeTypes];

type ModificationChange = {
    type: ChangeTypes["modify"];
    at: number;
    data: Uint8Array;
    size: number;
};

type DeleteChange = {
    type: ChangeTypes["delete"];
    at: number;
    size: number;
};

type InsertChange = {
    type: ChangeTypes["insert"];
    at: number;
    data: Uint8Array;
    size: number;
};

type OpenChange = {
    type: ChangeTypes["open"];
    size: number;
};

type Change = ModificationChange | DeleteChange | InsertChange | OpenChange;

export interface HistoryItem {
    changes: {
        change: Change;
        state: DocumentState;
    }[];
};

export interface DocumentState {
    ranges: RangeSource[];
    size: number;
}

export class HistoryChangeEvent extends CustomEvent<{
    history: {
        entries: HistoryItem[];
        entryPointer: number;
    }
}> {
    constructor(history: {
        entries: HistoryItem[];
        entryPointer: number;
    }) {
        super("historychange", {
            detail: { history },
        });
    }
}

export class EditManager {
    editor: Editor;

    #historyStackPointer: number = 0;

    get historyStackPointer() {
        return this.#historyStackPointer;
    }

    get historyState() {
        const state: HistoryState = {
            entries: this.#historyStack,
            entryPointer: this.#historyStackPointer
        }
        return state;
    }

    updateHistory(value: HistoryState | undefined) {
        this.historyState = value ?? {
            entries: [],
            entryPointer: 0
        };
    }

    set historyState(value: HistoryState) {
        this.#historyStack = value.entries;
        this.#historyStackPointer = value.entryPointer;
        this.#dispatchHistoryChange();
        this.editor.rendering.redraw().then(()=>this.editor.rendering.redraw()); // FIXME: only call redraw once
    }

    #dispatchHistoryChange() {
        this.editor.history.dispatchEvent(new HistoryChangeEvent(this.historyState));
    }

    set historyStackPointer(value: number) {
        this.#historyStackPointer = Math.min(value, this.#historyStack.length - 1);
        this.#dispatchHistoryChange();
        this.editor.rendering.redraw().then(()=>this.editor.rendering.redraw()); // FIXME: only call redraw once
    }
    #historyStack: HistoryItem[] = [];
    get historyStack() {
        return this.#historyStack;
    }

    get #state(): DocumentState | undefined {
        const newHistoryItemState = this.newHistoryItem?.changes.at(-1)?.state;
        if (newHistoryItemState) {
            return newHistoryItemState;
        }
        const currentHistoryItem: HistoryItem | undefined = this.#historyStack[this.historyStackPointer];
        if (currentHistoryItem) {
            const lastChange = currentHistoryItem.changes[currentHistoryItem.changes.length - 1];
            return lastChange?.state;
        }
    }

    get size() {
        return this.#state?.size ?? NaN;
    }

    newHistoryItem: HistoryItem | undefined;

    #beginHistoryItem() {
        this.newHistoryItem = {
            changes: [],
        };
    }

    transaction(fn: (historyItem: HistoryItem)=>void) {
        const wasInTransaction = Boolean(this.newHistoryItem);
        if (!wasInTransaction) {
            this.#beginHistoryItem();
        }
        try {
            fn(this.newHistoryItem!);
        }
        catch (e) {}
        if (!wasInTransaction) {
            this.#endHistoryItem();
        }
    }

    #endHistoryItem() {
        if (!this.newHistoryItem) {
            return;
        }
        if (this.newHistoryItem.changes.length === 0) {
            return;
        }
        this.#historyStack.splice(this.#historyStackPointer + 1);
        this.#historyStack.push(this.newHistoryItem);
        this.#historyStackPointer++;
        this.newHistoryItem = undefined;
        this.#dispatchHistoryChange();
    }

    openDocument(provider: DataProvider) {
        this.#historyStackPointer = 0;
        this.#historyStack = [{
            changes: [
                {
                    change: {
                        type: ChangeTypes.open,
                        size: 0
                    },
                    state: {
                        ranges: [
                            {
                                from: 0,
                                to: provider.size,
                                dataProvider: new WrappedDataProvider({
                                    slice: provider.slice.bind(provider),
                                    size: provider.size
                                })
                            }
                        ],
                        size: provider.size
                    }
                }
            ]
        }];
        this.#dispatchHistoryChange();
    }

    constructor(editor: Editor){
        this.editor = editor;
    }

    deleteAt(index: number, count: number = 1) {
        this.deleteRange(index, index + count);
    }

    deleteRange(deleteFrom: number, deleteTo: number) {
        const lastState = this.#state;
        if (!lastState) {
            throw new Error("No document state available");
        }
        this.transaction(historyItem=>{
            if (deleteFrom >= this.size) {
                throw new Error(`Delete range start is out of bounds: ${deleteFrom} >= ${this.size}`);
            }
            if (deleteTo > this.size) {
                throw new Error(`Delete range end is out of bounds: ${deleteTo} > ${this.size}`);
            }
            const deleteLength = deleteTo - deleteFrom;
            if (deleteLength <= 0) {
                throw new Error(`Delete range length must be positive: ${deleteLength}`);
            }
            const oldRanges = lastState.ranges;
            const newRanges = deleteRanges(oldRanges, deleteFrom, deleteTo);
            const newSize = lastState.size - deleteLength;
            assertConsistency(newRanges, { size: newSize });
            
            historyItem.changes.push({
                state: {
                    ranges: newRanges,
                    size: newSize
                },
                change: {
                    type: ChangeTypes.delete,
                    at: deleteFrom,
                    size: deleteTo - deleteFrom
                }
            });
        })
    }

    async slice(from: number, to: number) {
        const lastState = this.#state;
        if (!lastState) {
            return new Uint8Array(0);
        }

        return await sliceRanges(lastState.ranges, from, to);
    }
}