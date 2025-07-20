export function formatInt(n: number){
    const digits = Math.floor(n).toString().split('').reverse();
    let str = "";
    while (digits.length > 3){
        let [a, b, c, ..._rest] = digits;
        str += `${a}${b}${c},`;
        digits.splice(0,3);
    }
    str += digits.join('');
    return str.split('').reverse().join('');
}

export function formatHex(n: number){
    return "0x"+n.toString(16).toUpperCase();
}

export function formatUnit(byteCount: number){
    let power = 0;
    const p = 1024;
    
    while(Math.floor(byteCount / p) > 0){
        byteCount /= p;
        power++;
    }
    const n = byteCount;
    const map = new Map([
        [0, "B"],
        [1, "KiB"],
        [2, "MiB"],
        [3, "GiB"],
        [4, "TiB"],
        [5, "PiB"],
        [6, "EiB"],
        [7, "ZiB"],
        [8, "YiB"],
    ]);
    const unit = map.get(power);
    return `${n.toFixed(1)} ${unit}`;
}
