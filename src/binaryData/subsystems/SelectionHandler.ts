import { Editor } from "../editor";
import { Subclass } from "../subclass";

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

export class SelectionHandler extends Subclass<Editor> {
    cursorPosition = 0;
    onUpdateCursorListeners: ((cursorPosition: number)=>void)[] = [];
    onUpdateSelectionListeners: ((selections: Selections)=>void)[] = [];
    selectionStartIndex: number | undefined = undefined;
    selectionEndIndex: number | undefined = undefined;
    selections: Selections = [];
    selectionSource: SelectionSource | undefined = undefined;

    clearDraftSelection(){
        this.selectionStartIndex = undefined;
        this.selectionEndIndex = undefined;
    }
    clearSelections(){
        this.selections = [];
        this.clearDraftSelection();
    }
    onUpdateCursor(fn: (cursorPosition: number)=>void) {
        this.onUpdateCursorListeners.push(fn);
    }
    onUpdateSelections(fn: (selection: Selections)=>void) {
        this.onUpdateSelectionListeners.push(fn);
    }
    isSelecting(){
        return this.selectionStartIndex != undefined;
    }
    startSelection(selectionSource: SelectionSource, index: number, includeFirst: boolean){
        if (this.isSelecting()){
            this.endSelection();
        }
        
        this.selectionSource = selectionSource;
        this.selectionStartIndex = index;
        this.selectionEndIndex = undefined;
        if (includeFirst){
            this.selectionEndIndex = index;
        }
    }
    endSelection(){
        const range = this.getSelectionRange();
        if (range){
            this.selections = (this.getCombinedSelection());
            this.selectionStartIndex = undefined;
            this.selectionEndIndex = undefined;
            compressRanges(this.selections);
            for (let fn of this.onUpdateSelectionListeners) {
                fn(this.selections);
            }
        } else {
            this.selectionStartIndex = undefined;
            this.selectionEndIndex = undefined;
        }
    }
    cancelSelection(){
        this.clearDraftSelection();
    }
    onSelectOverByte(selectionSource: SelectionSource, index: number){
        if (this.selectionSource != selectionSource){
            return;
        }
        this.selectionEndIndex = index;
    }
    getCombinedSelection(): Range[] {
        const range = this.getSelectionRange();
        const start = this.selectionStartIndex;
        const end = this.selectionEndIndex;
        if (!range || start == undefined || end == undefined){
            return this.selections;
        }
        if (this.selections.length == 0){
            return [range];
        }
        const isStartInSelection = isInAnyRange(start,this.selections);
        const isEndInSelection = isInAnyRange(end,this.selections);
        if (!isStartInSelection && !isEndInSelection){
            return [...this.selections,range];
        }
        if (!isStartInSelection && isEndInSelection){
            return this.selections.map(selection=>{
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
        for (let selection of this.selections){
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
    getSelectionRange(): Range | undefined {
        const start = this.selectionStartIndex;
        const end = this.selectionEndIndex;
        if (start == undefined || end == undefined){
            return undefined;
        }

        const min = Math.min(start,end);
        const max = Math.max(start,end);

        return [min,max];
    }
    isSelectedIndex(index: number){
        return isInAnyRange(index,this.getCombinedSelection());
    }
    setCursor(index: number, clampToBounds?: true) {
        let clampedIndex = index;
        if (clampedIndex < 0){
            clampedIndex = 0;
        }
        if (clampedIndex >= this.$.intermediateState.value.dataProvider.size) {
            clampedIndex = this.$.intermediateState.value.dataProvider.size - 1;
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
