export interface DataProvider {
    size: number
    readAsync(from: number, length: number): Promise<Uint8Array>
    getBlob(): Promise<Blob>
}

export class BlobProvider implements DataProvider {
    blob: Blob
    size: number
    constructor(blob: Blob){
        this.blob = blob;
        this.size = blob.size;
    }
    async readAsync(from: number, length: number): Promise<Uint8Array> {
        const blob = await this.blob.slice(from, from+length);
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        return bytes;
    }
    async getBlob(): Promise<Blob> {
        return new Blob([this.blob]);
    }
}