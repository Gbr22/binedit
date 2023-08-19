import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { DerivedVar, TrackedVar } from "../reactivity";
import { bytesPerRow, rowHeight } from "../constants";
import type { EditorFile } from "../EditorFile";

export function ImplFileHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        currentFile = new TrackedVar<EditorFile | undefined>(undefined);

        fileRowCount = new DerivedVar(()=>{
            return Math.ceil( (this.currentFile.value?.blob.size ?? 0) / bytesPerRow);
        },this.currentFile);
        
        async getBytes(startByte: number): Promise<Uint8Array> {
            const buffer = await this.currentFile.value?.slice(startByte, startByte+bytesPerRow);
            const bytes = buffer ? new Uint8Array(buffer) : new Uint8Array(0);
            return bytes;
        }
    };

    return chainImpl(cls);
}