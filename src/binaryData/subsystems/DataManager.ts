import { Editor } from "../editor";
import { bytesPerRow } from "../constants";
import { BlobProvider, type DataProvider } from "../dataProvider";

export function getDataProviderRowCount(dataProvider: DataProvider){
    return Math.ceil( dataProvider.size / bytesPerRow );
}
export class DataManager {
    editor: Editor;

    constructor(editor: Editor){
        this.editor = editor;
        this.provider = new BlobProvider(new Blob());
    }

    provider: DataProvider;
    get size() {
        return this.editor.edit.size;
    }

    async slice(from: number, to: number) {
        return await this.editor.edit.slice(from, to);
    }

    async getRenderPage(startByte: number): Promise<Uint8Array> {
        const length = this.editor.size.viewportRowCount * bytesPerRow;
       
        return await this.slice(startByte,startByte+length);
    }
    async getByte(index: number): Promise<number | undefined> {
        const arr = await this.slice(index,index+1);
        if (arr.length == 0){
            return undefined;
        }
        return arr[0];
    }
}
