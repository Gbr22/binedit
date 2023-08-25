import { BlobProvider, type DataProvider } from "./binaryData/dataProvider";

export class TabData {
    name: string
    dataSource: DataProvider
    scrollPercent: number = 0
    
    constructor(name: string, data: DataProvider){
        this.name = name;
        this.dataSource = data;
    }

    static fromFile(file: File){
        return new TabData(file.name,new BlobProvider(file));
    }
}