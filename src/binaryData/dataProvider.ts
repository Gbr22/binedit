export interface DataProvider {
    size: number
    slice(from: number, to: number): Promise<Uint8Array>
    getBlob(): Promise<Blob>
    isWritable: boolean
    makeWritable(): Promise<void>
}

export class BlobProvider implements DataProvider {
    blob: Blob
    size: number
    isWritable: false = false;
    constructor(blob: Blob){
        this.blob = blob;
        this.size = blob.size;
    }
    async slice(from: number, to: number): Promise<Uint8Array> {
        const blob = await this.blob.slice(from, to);
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        return bytes;
    }
    async getBlob(): Promise<Blob> {
        return new Blob([this.blob]);
    }
    async makeWritable(): Promise<void> {
        throw new Error("Cannot create writable blob");
    }
}

export class FileHandleProvider implements DataProvider {
    handle: FileSystemFileHandle
    blob: Blob
    size: number
    writableStream?: FileSystemWritableFileStream
    isWritable: boolean = false;

    constructor(handle: FileSystemFileHandle, blob: File){
        this.handle = handle;
        this.blob = blob;
        this.size = blob.size;
    }
    static async new(handle: FileSystemFileHandle){
        return new FileHandleProvider(handle, await handle.getFile());
    }
    async slice(from: number, to: number): Promise<Uint8Array> {
        const blob = await this.blob.slice(from, to);
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        return bytes;
    }
    async getBlob(): Promise<Blob> {
        return new Blob([this.blob]);
    }
    async makeWritable(){
        const stream = await this.handle.createWritable();
        this.writableStream = stream;
        this.isWritable = true;
    }
}

export async function createDataProvider(source: FileSystemFileHandle | Blob): Promise<DataProvider> {
    if (source instanceof Blob){
        return new BlobProvider(source);
    } else if (source instanceof FileSystemFileHandle){
        return await FileHandleProvider.new(source);
    }
    throw new Error("Invalid source");
}