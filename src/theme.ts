const cache = new Map<string,string>();
export function emptyCssCache(){
    cache.clear();
}
export function getCssString(element: HTMLElement | null, name: string){
    if (!element) {
        return "";
    }
    if (cache.has(name)){
        return cache.get(name) || "";
    }
    let value = getComputedStyle(element as unknown as Element).getPropertyValue(name);
    cache.set(name,value);
    return value;
}
export function getCssNumber(element: HTMLElement | null, name: string){
    const str = getCssString(element, name);
    return Number(str);
}
export function getCssBoolean(element: HTMLElement | null, name: string){
    const n = getCssNumber(element, name);
    return n > 0;
}