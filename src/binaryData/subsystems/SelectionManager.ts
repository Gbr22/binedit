import { Editor } from "../editor";

export type Range = [number, number];

function canCombine(a: Range, b: Range) {
    return doesOverlap(a,b);
}
function doesOverlap(a: Range, b: Range){
    if (a[0] < b[0] && a[1] < b[0]){
        return false;
    }
    if (a[0] > b[1] && a[1] > b[1]){
        return false;
    }
    const ranges = [a,b];
    const min = Math.min(...ranges.map(e=>e[0]));
    const max = Math.max(...ranges.map(e=>e[1]));
    for (let i=min; i <= max; i++){
        const inA = isInAnyRange(i,[a]);
        const inB = isInAnyRange(i,[b]);
        if (inA && inB){
            return true;
        }
    }
    return false;
}
function combineRanges(...ranges: Range[]){
    const min = Math.min(...ranges.map(e=>e[0]));
    const max = Math.max(...ranges.map(e=>e[1]));
    return [min,max];
}
export function compressRanges(ranges: Range[]) {
    restart: while(true){
        for (let thisIndex = 0; thisIndex < ranges.length; thisIndex++){
            const thisItem = ranges[thisIndex];
            for (let otherIndex = thisIndex+1; otherIndex < ranges.length; otherIndex++){
                const otherItem = ranges[otherIndex];
                if (canCombine(thisItem,otherItem)){
                    const combined = combineRanges(thisItem,otherItem);
                    ranges.splice(otherIndex,1);
                    thisItem[0] = combined[0];
                    thisItem[1] = combined[1];
                    continue restart;
                }
            }
        }
        break;
    }
}

function isInAnyRange(index: number, ranges: Range[]){
    for (let range of ranges){
        const [min, max] = range;

        const isSelectedIndex = index >= min
            && index <= max;

        if (isSelectedIndex){
            return true;
        }
    }
    return false;
}

function fixRangeOrder(range: Range): Range {
    const min = Math.min(...range);
    const max = Math.max(...range);
    return [min, max];
}

export type Selections = Range[];

export type SelectionSource = "mouse" | "keyboard";

export function isSelectedIndex(index: number, ranges: Range[]){
    return isInAnyRange(index,ranges);
}

export class SelectionManager {
    cursorPosition = 0;
    onUpdateCursorListeners: ((cursorPosition: number)=>void)[] = [];
    onUpdateSelectionRangesListeners: ((ranges: Selections)=>void)[] = [];
    startIndex: number | undefined = undefined;
    endIndex: number | undefined = undefined;
    ranges: Range[] = [];
    pendingRanges: Range[] = [];
    source: SelectionSource | undefined = undefined;
    editor: Editor;
    
    constructor(editor: Editor){
        this.editor = editor;
    }

    clearRanges(){
        this.ranges = [];
        this.cancelRange();
    }
    onUpdateCursor(fn: (cursorPosition: number)=>void) {
        this.onUpdateCursorListeners.push(fn);
    }
    onUpdateRanges(fn: (selection: Selections)=>void) {
        this.onUpdateSelectionRangesListeners.push(fn);
    }
    isSelecting(){
        return this.startIndex != undefined;
    }
    startRange(selectionSource: SelectionSource, index: number, includeFirst: boolean){
        if (this.isSelecting()){
            this.endRange();
        }
        
        this.source = selectionSource;
        this.startIndex = index;
        this.endIndex = undefined;
        if (includeFirst){
            this.endIndex = index;
        }
        this.pendingRanges = this.#getCombinedRanges();
    }
    endRange(){
        const range = this.getRange();
        if (range){
            this.ranges = (this.#getCombinedRanges());
            this.startIndex = undefined;
            this.endIndex = undefined;
            compressRanges(this.ranges);
            for (let fn of this.onUpdateSelectionRangesListeners) {
                fn(this.ranges);
            }
        } else {
            this.startIndex = undefined;
            this.endIndex = undefined;
        }
        this.pendingRanges = this.#getCombinedRanges();
    }
    cancelRange(){
        this.startIndex = undefined;
        this.endIndex = undefined;
        this.pendingRanges = this.#getCombinedRanges();
    }
    hoverOverByte(selectionSource: SelectionSource, index: number){
        if (this.source != selectionSource){
            return;
        }
        this.endIndex = index;
        this.pendingRanges = this.#getCombinedRanges();
    }
    #getCombinedRanges(): Range[] {
        const range = this.getRange();
        const start = this.startIndex;
        const end = this.endIndex;
        if (!range || start == undefined || end == undefined){
            return this.ranges;
        }
        if (this.ranges.length == 0){
            return [range];
        }
        const isStartInSelection = isInAnyRange(start,this.ranges);
        const isEndInSelection = isInAnyRange(end,this.ranges);
        if (!isStartInSelection && !isEndInSelection){
            return [...this.ranges,range];
        }
        if (!isStartInSelection && isEndInSelection){
            return this.ranges.map(selection=>{
                if (!isInAnyRange(end,[selection])){
                    return selection;
                }
                // extend selection
                const min = Math.min(selection[0],range[0]);
                const max = Math.max(selection[1],range[1]);
                return [min,max];
            });
        }

        const newArr: Range[] = [];
        for (let selection of this.ranges){
            const isMinInSelection = isInAnyRange(range[0],[selection]);
            const isMaxInSelection = isInAnyRange(range[1],[selection]);

            if (!isMinInSelection && !isMaxInSelection){
                newArr.push(selection);
                continue;
            }
            if (isMinInSelection){
                newArr.push([
                    selection[0],
                    range[0]-1
                ])
            }
            if (isMaxInSelection){
                newArr.push([
                    range[1]+1,
                    selection[1]
                ])
            }
        }
        
        return newArr;
    }
    getRange(): Range | undefined {
        const start = this.startIndex;
        const end = this.endIndex;
        if (start == undefined || end == undefined){
            return undefined;
        }

        const min = Math.min(start,end);
        const max = Math.max(start,end);

        return [min,max];
    }
    isSelectedIndex(index: number){
        return isSelectedIndex(index,this.pendingRanges)
    }
    setCursor(index: number, clampToBounds?: true) {
        let clampedIndex = index;
        if (clampedIndex < 0){
            clampedIndex = 0;
        }
        if (clampedIndex >= this.editor.data.provider.size) {
            clampedIndex = this.editor.data.provider.size - 1;
        }
        if (clampedIndex != index && !clampToBounds) {
            return;
        }
        const prev = this.cursorPosition;
        this.cursorPosition = clampedIndex;
        if (this.cursorPosition == prev) {
            return;
        }
        this.onUpdateCursorListeners.forEach(fn=>{
            fn(this.cursorPosition);
        })
    }
}
