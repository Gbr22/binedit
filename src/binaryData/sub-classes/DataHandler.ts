import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { DerivedVar, TrackedVar } from "../reactivity";
import { bytesPerRow, rowHeight } from "../constants";
import type { TabData } from "../../TabData";
import type { DataProvider } from "../dataProvider";

export function getDataProviderRowCount(dataProvider: DataProvider){
    return Math.ceil( dataProvider.size / bytesPerRow );
}

export function ImplDataHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        dataToRender = new TrackedVar<Uint8Array>(new Uint8Array(0));

        async getPage(dataProvider: DataProvider, startByte: number): Promise<Uint8Array> {
            const that = this as any as EditorThis;
            const length = that.viewportRowCount.value * bytesPerRow;
           
            return await dataProvider.readAsync(startByte,length);
        }
        
        getBytes(startByte: number): Uint8Array {
            const that = this as any as EditorThis;

            const index = startByte - that.intermediateState.value.topRow * bytesPerRow;
            const buffer = that.dataToRender.value.slice(index, index + bytesPerRow);
            return new Uint8Array(buffer);
        }

        getByte(i: number): number | undefined {
            const that = this as any as EditorThis;

            return that.dataToRender.value[i];
        }
    };

    return chainImpl(cls);
}