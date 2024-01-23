import type { Hover } from "../GestureManager/MouseGestureManager";

interface StateDependencies {
    positionInFile: number
    currentHover: Hover
}

export class State {
    positionInFile: number;
    currentHover: Hover;
    
    constructor(deps: StateDependencies){
        this.positionInFile = deps.positionInFile;
        this.currentHover = deps.currentHover;
    }
}