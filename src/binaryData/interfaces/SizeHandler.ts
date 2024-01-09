import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { rowHeight } from "../constants";
import type { DataProvider } from "../dataProvider";
import { getDataProviderRowCount } from "./DataHandler";

export interface ISizeHandler {
    viewportRowCount: TrackedVar<number>;

    initSizeHandler: ()=>void
    resize: ()=>void
    toValidTopRow: (dataProvider: DataProvider, topRow: number)=>number
}

export function patchSizeHandler(){
    Editor.prototype.initSizeHandler = function(){
        this.viewportRowCount = new TrackedVar(0);
    
        const resizeObserver = new ResizeObserver((entries) => {
            this.resize();
        });
        
        resizeObserver.observe(this.element);
    }
    
    Editor.prototype.resize = function(){
        const rect = this.element.getBoundingClientRect();
        this.viewportRowCount.value = Math.floor(rect.height / rowHeight);
        this.desiredState.value = this.desiredState.value.with({
            width: Math.round(rect.width * window.devicePixelRatio),
            height: Math.round(rect.height * window.devicePixelRatio)
        })
    }
    
    Editor.prototype.toValidTopRow = function(dataProvider: DataProvider, topRow: number){
        if (topRow < 0){
            return 0;
        }
        const maxRow = getDataProviderRowCount(dataProvider) - Math.floor(this.viewportRowCount.value / 2);
        if (topRow > maxRow){
            return maxRow;
        }
        return topRow;
    }
}