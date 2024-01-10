import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import { defineSubsystem, subsystemProps } from "../composition";

export function getDataProviderRowCount(dataProvider: DataProvider){
    return Math.ceil( dataProvider.size / bytesPerRow );
}

export const DataHandler = defineSubsystem({
    name: "DataHandler",
    props: subsystemProps<{}>(),
    proto: {
        async getPage(this: Editor, dataProvider: DataProvider, startByte: number): Promise<Uint8Array> {
            const length = this.viewportRowCount.value * bytesPerRow;
           
            return await dataProvider.readAsync(startByte,length);
        },
        getBytes(this: Editor, startByte: number): Uint8Array {
            const index = startByte - this.intermediateState.value.topRow * bytesPerRow;
            const buffer = this.dataToRender.value.slice(index, index + bytesPerRow);
            return new Uint8Array(buffer);
        },
        getByte(this: Editor, i: number): number | undefined {
            return this.dataToRender.value[i];
        }
    },
    init(this: Editor) {
        return {
            dataToRender: new TrackedVar<Uint8Array>(new Uint8Array(0))
        }
    }
});
