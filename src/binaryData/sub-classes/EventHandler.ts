import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import { Editor } from "../editor";
import { getDataProviderRowCount } from "./DataHandler";

export interface IEventHandler {
    onScroll: (callback: (scrollPercent: number)=>void)=>void
    setState: (props: { dataProvider: DataProvider, scrollPercent: number })=>void
}

export function patchEventHandler(){
    Editor.prototype.onScroll = function(fn: (scrollPercent: number)=>void){
        this.renderedState.subscribe(()=>{
            const topRow = this.renderedState.value.topRow;
            const rowCount = getDataProviderRowCount(this.renderedState.value.dataProvider);
            const percent = topRow / rowCount;
            fn(percent);
        })
    }
    
    Editor.prototype.setState = function(props: { dataProvider: DataProvider, scrollPercent: number }){
        const max = props.dataProvider.size || 0;
        const topRow = Math.floor((max * props.scrollPercent) / bytesPerRow);
    
        this.desiredState.value = this.desiredState.value.with({
            topRow,
            dataProvider: props.dataProvider
        })
    }
}