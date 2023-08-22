export class EditorFile {
    name: string
    blob: Blob
    
    constructor(file: File){
        this.name = file.name;
        this.blob = file;
    }
}