import { TabData } from './TabData';
import { switchTab } from './tabs';
import { state } from './state';

const input = document.createElement("input");
input.type = "file";

let clean = ()=>undefined

export async function openFile(): Promise<File> {
    input.multiple = false;
    const files = await clickFileInput();
    return files[0];
}
export async function clickFileInput(): Promise<File[]> {
    input.files = null;
    input.value = "";
    clean();
    let settled = false;
    const promise = new Promise<File[]>((resolve,reject)=>{
        const listener = ()=>{
            settled = true;
            clean();
            const files = Array.from(input.files || []);
            input.removeEventListener("change",listener);
            if (files.length){
                resolve(files);
            }
            reject(new Error("No files"));
        }
        clean = ()=>{
            if (!settled){
                reject(new Error("No files"));
            }
            clean = ()=>undefined
            input.removeEventListener("change",listener);
        }
        input.addEventListener("change", listener);
        input.click();
    })
    return promise;
}
export async function openFiles(): Promise<File[]> {
    input.multiple = true;
    return await clickFileInput();
}