export class EditorFile {
    name: string
    file: File
    
    constructor(file: File){
        this.name = file.name;
        this.file = file;
    }
}