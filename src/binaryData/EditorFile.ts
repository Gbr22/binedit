const sectionSize = 2**15;

export class EditorFile {
    name: string
    blob: Blob
    
    map = new Map<number,ArrayBuffer | Error | Promise<ArrayBuffer>>();

    constructor(file: File){
        this.name = file.name;
        this.blob = file;
    }

    async getSection(sectionStart: number){
        const value = this.map.get(sectionStart);
        const sectionEnd = Math.min(sectionStart + sectionSize, this.blob.size);

        if (value instanceof Error){
            return undefined;
        }
        if (value instanceof Promise){
            try {
                return await value;
            } catch(err){
                this.map.set(sectionStart,new Error());
                return undefined;
            }
        }
        if (value instanceof ArrayBuffer){
            return value;
        }
        try {
            const promise = this.blob.slice(sectionStart, sectionEnd).arrayBuffer();
            this.map.set(sectionStart,promise);
            promise.then(buffer=>{
                this.map.set(sectionStart,buffer);
            })
            return await promise;
        } catch(err){
            this.map.set(sectionStart,new Error());
            return undefined;
        }
    }

    async slice(startByte: number, length: number){
        if (startByte >= this.blob.size){
            return undefined;
        }

        const startInSection = startByte % sectionSize;
        const sectionStart = startByte - startInSection;

        let buffer: ArrayBuffer | undefined = await this.getSection(sectionStart);
        return buffer?.slice(startInSection,startInSection+length);
    }
}