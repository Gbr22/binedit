import { TabData } from './TabData';
import { switchTab } from './tabs';
import { state } from './state';

const input = document.createElement("input");
input.type = "file";

export async function openFile(): Promise<File> {
    return new Promise((resolve,reject)=>{
        const listener = ()=>{
            const file = input?.files?.[0];
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