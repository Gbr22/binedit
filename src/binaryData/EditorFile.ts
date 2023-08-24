import { BlobProvider, type DataProvider } from "./dataProvider";

export class EditorFile {
    name: string
    dataSource: DataProvider
    
    constructor(name: string, data: Blob){
        this.name = name;
        this.dataSource = new BlobProvider(data);
    }

    static fromFile(file: File){
        return new EditorFile(file.name,file);
    }
}