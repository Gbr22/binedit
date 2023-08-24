import { EditorFile } from './binaryData/EditorFile';
import { state } from './state';

const input = document.createElement("input");
input.type = "file";

export function openFile(){
    input.click();
}

input.addEventListener("change", async ()=>{
    const domFile = input?.files?.[0];
    if (!domFile){
        return;
    }
    const file = EditorFile.fromFile(domFile);
    console.log("open file",file);
    state.files.push(file);
    state.currentFile = file;
})