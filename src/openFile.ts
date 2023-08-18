import { type File, state } from './state';

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
    const name = domFile.name;
    const file: File = {
        name,
        blob: domFile
    }
    state.files.push(file);
    state.currentFile = file;
})