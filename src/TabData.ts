import { BlobProvider, type DataProvider } from "./binaryData/dataProvider";

export class TabData {
    name: string
    dataSource: DataProvider
    scrollPercent: number = 0
    
    constructor(name: string, data: Blob){
        this.name = name;
        this.dataSource = new BlobProvider(data);
    }

    static fromFile(file: File){
        return new TabData(file.name,file);
    }
}