import { bytesPerRow } from "./constants";
import { preferences } from "@/preferences";

export interface Row {
    container: HTMLElement
    bytes: HTMLElement[]
    printables: HTMLElement[]
    startByte: HTMLElement
}

export function getRowIndex(startByte: number){
    return Math.floor(startByte / bytesPerRow);
}

export interface Printable {
    text: string
    type: "ascii" | "control" | "other"
}

export function toHex(n: number){
    if (preferences.case == 'upper') {
        return n.toString(16).toUpperCase();
    }
    return n.toString(16).toLowerCase();
}

export function byteToPrintable(byte: number): Printable {
    const isNormalAscii = (byte >= 33 && byte <= 126);
    const isExtenedAscii = (byte >= 128 && byte <= 254);
    const isControlCharacter = (byte >= 0 && byte <= 32);

    if (isNormalAscii){
        return {
            text: String.fromCharCode(byte),
            type: "ascii"
        };
    }
    if (isControlCharacter){
        return {
            text: String.fromCodePoint(byte + 0x2400),
            type: "control"
        };
    }
    else {
        return {
            text: '.',
            type: "other"
        };
    }
}
