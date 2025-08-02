import { assertConsistency, deleteRanges, sliceRanges, WrappedDataProvider, type RangeSource } from "../editing/editing";
import type { Editor } from "../editor";

export const ChangeTypes = Object.freeze({
    modify: Symbol("modify"),
    delete: Symbol("delete"),
});
export type ChangeTypes = typeof ChangeTypes;
export type ChangeType = ChangeTypes[keyof ChangeTypes];

type ModificationChange = {
    type: ChangeTypes["modify"];
    from: number;
    data: Uint8Array;
    length: number;
};

type DeleteChange = {
    type: ChangeTypes["delete"];
    from: number;
    length: number;
};

type InsertChange = {
    type: ChangeTypes["delete"];
    from: number;
    data: Uint8Array;
    length: number;
};

type Change = ModificationChange | DeleteChange | InsertChange;



class DocumentState {
    init: { ranges: RangeSource[], size: number };
    get ranges() {
        return this.init.ranges;
    }
    get size() {
        return this.init.size;
    }

    constructor(init: { ranges: RangeSource[], size: number }) {
        this.init = init;
    }

    async slice(from: number, to: number): Promise<Uint8Array> {
        return sliceRanges(this.ranges, from, to);
    }
};

export class EditManager {
    editor: Editor;

    changes: Change[] = [];
    states: DocumentState[] = [];

    get size() {
        if (this.states.length === 0) {
            return NaN;
        }
        return this.states[this.states.length - 1].size;
    }

    constructor(editor: Editor){
        this.editor = editor;
        this.states.push(new DocumentState({
            ranges: [
                {
                    from: 0,
                    get to() {
                        return editor.data.provider.size
                    },
                    get dataProvider() {
                        if (!editor.data.provider) {
                            return new WrappedDataProvider({
                                slice: () => Promise.resolve(new Uint8Array()),
                                size: 0
                            });
                        }
                        return new WrappedDataProvider({
                            slice: editor.data.provider.slice.bind(editor.data.provider),
                            size: editor.data.provider.size
                        })
                    }
                }
            ],
            get size() {
                return editor.data.provider.size;
            }
        }));
    }

    deleteAt(index: number) {
        this.deleteRange(index, index + 1);
    }

    deleteRange(deleteFrom: number, deleteTo: number) {
        if (deleteFrom >= this.size) {
            throw new Error(`Delete range start is out of bounds: ${deleteFrom} >= ${this.size}`);
        }
        if (deleteTo > this.size) {
            throw new Error(`Delete range end is out of bounds: ${deleteTo} > ${this.size}`);
        }
        const deleteLength = deleteTo - deleteFrom;
        const lastState = this.states[this.states.length - 1];
        const oldRanges = lastState.ranges;
        const newRanges = deleteRanges(oldRanges, deleteFrom, deleteTo);
        const newSize = lastState.size - deleteLength;
        assertConsistency(newRanges, { size: newSize });
        this.states.push(new DocumentState({
            ranges: newRanges,
            size: newSize
        }));
        this.changes.push({
            type: ChangeTypes.delete,
            from: deleteFrom,
            length: deleteTo - deleteFrom
        });
    }

    async slice(from: number, to: number) {
        if (this.states.length === 0) {
            throw new Error("No document state available");
        }

        const lastState = this.states[this.states.length - 1];
        return await lastState.slice(from, to);
    }
}