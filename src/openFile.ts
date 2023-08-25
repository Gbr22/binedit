import { TabData } from './TabData';
import { switchTab } from './tabs';
import { state } from './state';

const input = document.createElement("input");
input.type = "file";

export async function openFile(): Promise<File> {
    input.multiple = false;
    return new Promise((resolve,reject)=>{
        const listener = ()=>{
            const file = input.files?.[0];
            input.removeEventListener("change",listener);
            if (file){
                resolve(file);
            }
            reject(new Error("No file"));
        }
        input.addEventListener("change", listener);
        input.click();
    })
}
export async function openFiles(): Promise<File[]> {
    input.multiple = true;
    return new Promise((resolve,reject)=>{
        const listener = ()=>{
            const files = Array.from(input.files || []);
            input.removeEventListener("change",listener);
            if (files.length){
                resolve(files);
            }
            reject(new Error("No files"));
        }
        input.addEventListener("change", listener);
        input.click();
    })
}