const cache = new Map<string,string>();
export function emptyCssCache(){
    cache.clear();
}
export function getCssString(name: string){
    if (cache.has(name)){
        return cache.get(name) || "";
    }
    let value = getComputedStyle(document.documentElement).getPropertyValue(name);
    cache.set(name,value);
    return value;
}
export function getCssNumber(name: string){
    const str = getCssString(name);
    return Number(str);
}
export function getCssBoolean(name: string){
    const n = getCssNumber(name);
    return n > 0;
}