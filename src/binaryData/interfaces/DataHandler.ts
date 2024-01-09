import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";

export function getDataProviderRowCount(dataProvider: DataProvider){
    return Math.ceil( dataProvider.size / bytesPerRow );
}

export interface IDataHandler {
    initDataHandler: ()=>void
    dataToRender: TrackedVar<Uint8Array>
    getPage: (dataProvider: DataProvider, startByte: number)=>Promise<Uint8Array>
    getBytes: (startByte: number)=>Uint8Array
    getByte: (i: number)=>number | undefined
}

export function patchDataHandler(){
    Editor.prototype.initDataHandler = function(this: Editor){
        this.dataToRender = new TrackedVar<Uint8Array>(new Uint8Array(0));
    }
    Editor.prototype.getPage = async function(this: Editor, dataProvider: DataProvider, startByte: number): Promise<Uint8Array> {
        const length = this.viewportRowCount.value * bytesPerRow;
       
        return await dataProvider.readAsync(startByte,length);
    }
    Editor.prototype.getBytes = function(this: Editor, startByte: number): Uint8Array {
        const index = startByte - this.intermediateState.value.topRow * bytesPerRow;
        const buffer = this.dataToRender.value.slice(index, index + bytesPerRow);
        return new Uint8Array(buffer);
    }
    Editor.prototype.getByte = function(i: number): number | undefined {
        return this.dataToRender.value[i];
    }
}