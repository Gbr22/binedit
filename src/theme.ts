export function getCssString(element: HTMLElement | null, name: string){
    let value = getComputedStyle(element as unknown as Element).getPropertyValue(name);
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