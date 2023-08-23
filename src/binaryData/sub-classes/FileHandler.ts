import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { DerivedVar, TrackedVar } from "../reactivity";
import { bytesPerRow, rowHeight } from "../constants";
import type { EditorFile } from "../EditorFile";

export function ImplFileHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        currentFile = new TrackedVar<EditorFile | undefined>(undefined);

        dataToRender = new TrackedVar<Uint8Array>(new Uint8Array(0));

        fileRowCount = new DerivedVar(()=>{
            return Math.ceil( (this.currentFile.value?.blob.size ?? 0) / bytesPerRow);
        },this.currentFile);

        async getPage(startByte: number): Promise<Uint8Array> {
            const that = this as any as EditorThis;
            const file = that.currentFile.value;
            const length = that.viewportRowCount.value * bytesPerRow;
            if (!file){
                return new Uint8Array();
            }
            const blob = await file.blob.slice(startByte,startByte+length);
            const buffer = await blob.arrayBuffer();
            if (!buffer){
                return new Uint8Array();
            }
            return new Uint8Array(buffer);
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