import { BlobProvider, createDataProvider, type DataProvider } from "./binaryData/dataProvider";

export class TabData {
    name: string
    dataSource: DataProvider
    scrollPercent: number = 0
    
    constructor(name: string, data: DataProvider){
        this.name = name;
        this.dataSource = data;
    }

    static async fromFile(file: File | FileSystemFileHandle){
        const provider = await createDataProvider(file);
        return new TabData(file.name,provider);
    }
}