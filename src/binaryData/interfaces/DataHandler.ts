import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import { applySubsystem, defineSubsystem, subsystemProps, type SubsystemInterface } from "../composition";

export function getDataProviderRowCount(dataProvider: DataProvider){
    return Math.ceil( dataProvider.size / bytesPerRow );
}

export type IDataHandler = SubsystemInterface<typeof DataHandler>;

export const DataHandler = defineSubsystem({
    name: "DataHandler",
    props: subsystemProps<{
        dataToRender: TrackedVar<Uint8Array>
    }>(),
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
        this.dataToRender = new TrackedVar<Uint8Array>(new Uint8Array(0));
    }
})

export function patchDataHandler(){
    applySubsystem(Editor,DataHandler);
}