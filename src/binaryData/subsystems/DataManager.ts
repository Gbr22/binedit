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

    async getRenderPage(dataProvider: DataProvider, startByte: number): Promise<Uint8Array> {
        const length = this.editor.size.viewportRowCount * bytesPerRow;
       
        return await dataProvider.readAsync(startByte,length);
    }
    async getByte(index: number): Promise<number | undefined> {
        const arr = await this.provider.readAsync(index,1);
        if (arr.length == 0){
            return undefined;
        }
        return arr[0];
    }
}
