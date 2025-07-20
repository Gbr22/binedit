import { createDataProvider, type DataProvider } from "./binaryData/dataProvider";
import type { Selections } from "./binaryData/subsystems/SelectionManager";

export class TabData {
    name: string
    dataSource: DataProvider
    positionInFile: number = 0
    cursorPosition: number = 0
    selections: Selections = []
    
    constructor(name: string, data: DataProvider){
        this.name = name;
        this.dataSource = data;
    }

    static async fromFile(file: File | FileSystemFileHandle){
        const provider = await createDataProvider(file);
        return new TabData(file.name,provider);
    }
}