import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";

export function getDataProviderRowCount(dataProvider: DataProvider){
    return Math.ceil( dataProvider.size / bytesPerRow );
}
export class DataManager {
    editor: Editor;
    dataToRender = new TrackedVar<Uint8Array>(new Uint8Array(0));

    constructor(editor: Editor){
        this.editor = editor;
    }
    async getRenderPage(dataProvider: DataProvider, startByte: number): Promise<Uint8Array> {
        const length = this.editor.size.viewportRowCount * bytesPerRow;
       
        return await dataProvider.readAsync(startByte,length);
    }
    getRenderBytes(startByte: number): Uint8Array {
        const index = startByte - this.editor.update.intermediateState.value.positionInFile;
        const buffer = this.dataToRender.value.slice(index, index + this.editor.renderer.bytesPerRow);
        return new Uint8Array(buffer);
    }
    getRenderByte(i: number): number | undefined {
        return this.dataToRender.value[i];
    }
    async getByte(index: number): Promise<number | undefined> {
        const dataProvider = this.editor.update.intermediateState.value.dataProvider;
        const arr = await dataProvider.readAsync(index,1);
        if (arr.length == 0){
            return undefined;
        }
        return arr[0];
    }
}
