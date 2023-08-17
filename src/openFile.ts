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
    const buffer = await domFile.arrayBuffer();
    const file: File = {
        name,
        buffer
    }
    state.files.push(file);
    state.currentFile = file;
})