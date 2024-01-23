import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import { defineSubsystem } from "../composition";

export function getDataProviderRowCount(dataProvider: DataProvider){
    return Math.ceil( dataProvider.size / bytesPerRow );
}

export const DataHandler = defineSubsystem({
    name: "DataHandler",
    proto: {
        async getRenderPage(this: Editor, dataProvider: DataProvider, startByte: number): Promise<Uint8Array> {
            const length = this.size.viewportRowCount * bytesPerRow;
           
            return await dataProvider.readAsync(startByte,length);
        },
        getRenderBytes(this: Editor, startByte: number): Uint8Array {
            const index = startByte - this.intermediateState.value.positionInFile;
            const buffer = this.dataToRender.value.slice(index, index + this.renderer.bytesPerRow);
            return new Uint8Array(buffer);
        },
        getRenderByte(this: Editor, i: number): number | undefined {
            return this.dataToRender.value[i];
        },
        async getByte(this: Editor, index: number): Promise<number | undefined> {
            const dataProvider = this.intermediateState.value.dataProvider;
            const arr = await dataProvider.readAsync(index,1);
            if (arr.length == 0){
                return undefined;
            }
            return arr[0];
        }
    },
    init(this: Editor) {
        return {
            dataToRender: new TrackedVar<Uint8Array>(new Uint8Array(0))
        }
    }
});
