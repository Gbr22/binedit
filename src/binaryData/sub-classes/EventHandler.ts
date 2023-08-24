import { Base, type Constructor, chainImpl } from "../composition";
import { bytesPerRow } from "../constants";
import type { DataProvider } from "../dataProvider";
import type { EditorThis } from "../editor";
import { getDataProviderRowCount } from "./DataHandler";

export function ImplEventHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {
        onScroll(fn: (scrollPercent: number)=>void){
            const that = this as unknown as EditorThis;

            that.renderedState.subscribe(()=>{
                const topRow = that.renderedState.value.topRow;
                const rowCount = getDataProviderRowCount(that.renderedState.value.dataProvider);
                const percent = topRow / rowCount;
                fn(percent);
            })
        }
        setState(props: { dataProvider: DataProvider, scrollPercent: number }){
            const that = this as unknown as EditorThis;

            const max = props.dataProvider.size || 0;
            const topRow = Math.floor((max * props.scrollPercent) / bytesPerRow);

            that.desiredState.value = that.desiredState.value.with({
                topRow,
                dataProvider: props.dataProvider
            })
        }
    };

    return chainImpl(cls);
}