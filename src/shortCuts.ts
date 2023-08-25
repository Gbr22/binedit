import type { Action } from "./actions/action"
import { newAction } from "./actions/new"
import { openAction } from "./actions/open"
import { saveAction } from "./actions/save"

interface ShortCut {
    action: Action
    ctrl?: true
    shift?: true
    alt?: true
    meta?: true
    code: string
    at: "keypress" | "keyup" | "keydown"
}

const shortCuts: ShortCut[] = [
    {
        ctrl: true,
        code: "KeyM",
        action: newAction,
        at: "keydown"
    },
    {
        ctrl: true,
        code: "KeyO",
        action: openAction,
        at: "keypress"
    },
    {
        ctrl: true,
        code: "KeyS",
        action: saveAction,
        at: "keypress"
    }
];

function checkShortCuts(e: KeyboardEvent, type: "keypress" | "keyup" | "keydown"){
    for (let shortCut of shortCuts){
        const match =
            e.type == type &&
            e.code == shortCut.code &&
            e.ctrlKey == !!shortCut.ctrl &&
            e.altKey == !!shortCut.alt &&
            e.shiftKey == !!shortCut.shift &&
            e.metaKey == !!shortCut.meta
        ;
        if (match){
            console.log("Action",shortCut.action);
            e.preventDefault();
            e.stopPropagation();
            shortCut.action.fn();
        }
    }
}

export function initShortCuts(){

    window.addEventListener("keydown",e=>{
        checkShortCuts(e,"keydown");
    })
    window.addEventListener("keyup",e=>{
        checkShortCuts(e,"keyup");
    })
    window.addEventListener("keypress",e=>{
        checkShortCuts(e,"keypress");
    })
}