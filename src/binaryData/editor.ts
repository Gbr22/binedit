import { ImplCreateDom } from "./sub-classes/DomHandler";
import { DerivedVar, TrackedVar, createDependantFunction } from "./reactivity";
import { bytesPerRow } from "./constants";
import { getRowIndex, toHex, type Row, type Printable, byteToPrintable } from "./row";
import styles from "./styles.module.scss";
import { ImplScrollHandler } from "./sub-classes/ScrollHandler";
import { Implementations } from "./composition";
import { ImplSizeHandler } from "./sub-classes/SizeHandler";
import { ImplFileHandler } from "./sub-classes/FileHandler";
import { ImplRenderingHandler } from "./sub-classes/RenderingHandler";
import { ImplUpdateHandler } from "./sub-classes/UpdateHandler";

export type EditorThis = InstanceType<typeof Editor>;

export class Editor
extends Implementations
    (ImplCreateDom)
    (ImplScrollHandler)
    (ImplSizeHandler)
    (ImplFileHandler)
    (ImplRenderingHandler)
    (ImplUpdateHandler)
.$
{
    rowMap = new Map<number, Row>();

    constructor(){
        super();

        this.initDomHandler();
        this.initScrollHandler();
        this.initSizeHandler();
        this.initUpdateHandler();
    }

    overScollTop = 0;
    overScollBottom = 0;
    shouldRemove(startByte: number){
        const rowIndex = getRowIndex(startByte);
        const start = this.topRow.value - this.overScollTop;
        const end = this.topRow.value + this.viewportRowCount.value + this.overScollBottom;
        const isVisible = rowIndex >= start && rowIndex < end;
        return !isVisible;
    }

    collectGarbage(){
        for (let startByte of this.rowMap.keys()){
            if (this.shouldRemove(startByte)){
                this.rowMap.get(startByte)?.container.remove();
                this.rowMap.delete(startByte);
            }
        }
    }

    takeGarbageRow(){
        for (let startByte of this.rowMap.keys()){
            if (!this.shouldRemove(startByte)){
                continue;
            }
            const row = this.rowMap.get(startByte);
            if (row?.bytes.length != bytesPerRow){
                continue;
            }
            this.rowMap.delete(startByte);
            return row;
        }
    }

    async recycleOrCreateRow(props:
        { renderIndex: number, startByte: number }
    ){
        const recycled = await this.recycleRow(props);
        if (!recycled){
            return this.createNewRow(props);
        }
        return recycled;
    }

    async recycleRow(props:
        { renderIndex: number, startByte: number }
    ){
        const { renderIndex, startByte } = props;
        const row = this.takeGarbageRow();
    
        if (!row){
            return;
        }
    
        await this.updateRowDom(row,props);
    
        return row;
    }

    async updateRowDom(row: Row, props:
        { renderIndex: number, startByte: number }
    ) {
        const { renderIndex, startByte } = props;
        this.rowMap.set(startByte,row);
    
        const { container } = row;
    
        const index = getRowIndex(startByte);
        const top = (this.topRow.value % 1024);
        const shift = this.topRow.value - top;
        const shiftedIndex = index - shift;
        container.dataset["index"] = index.toString();
        container.style.setProperty("--index",shiftedIndex.toString());
    
        const count = toHex(startByte).padStart(8,'0');
        row.startByte.innerText = count;
    
        const bytes = await this.getBytes(startByte);
        for (let i = 0; i < row.bytes.length; i++){
            const byte: number | undefined = bytes[i];
            if (byte == undefined){
                row.bytes[i].innerText = '';
                continue;
            }
            row.bytes[i].innerText = toHex(byte).padStart(2,'0');
        }
        for (let i = 0; i < row.printables.length; i++){
            const byte: number | undefined = bytes[i];
            const printable: Printable | undefined = byte != undefined ? byteToPrintable(byte) : undefined;
            if (!printable){
                row.printables[i].innerText = '';
                row.printables[i].dataset["type"] = "undefined";
                continue;
            }
            row.printables[i].innerText = printable.text;
            row.printables[i].dataset["type"] = printable.type;
        }
    }

    createRowDom() {
        console.log("create row");
    
        const container = document.createElement("div");
        container.classList.add(styles.row);
    
        const startByte = document.createElement("button");
        startByte.classList.add(styles.count);
        container.appendChild(startByte);
    
        const list = document.createElement("div");
        list.classList.add(styles.list);
        container.appendChild(list);
    
        const bytes: HTMLElement[] = [];
        for (let i=0; i < bytesPerRow; i++){
            const element = document.createElement("button");
            list.appendChild(element);
            bytes.push(element);
        }
    
        const text = document.createElement("div");
        text.classList.add(styles.text);
        container.appendChild(text);
        const printables: HTMLElement[] = [];
        for (let i=0; i < bytesPerRow; i++){
            const element = document.createElement("button");
            text.appendChild(element);
            printables.push(element);
        }
    
        this.dataView.appendChild(container);
    
        return {
            container,
            bytes,
            printables,
            startByte
        } satisfies Row;
    }

    redrawAll(){
        for(let renderIndex = 0; renderIndex < this.viewportRowCount.value; renderIndex++){
            const index = this.topRow.value + renderIndex;
            const startByte = index * bytesPerRow;
            const row = this.rowMap.get(startByte);
            if (!row){
                continue;
            }
            this.updateRowDom(row,{
                startByte,
                renderIndex
            });
        }
    }

    async createNewRow(props:
        { renderIndex: number, startByte: number }
    ){
        const { renderIndex, startByte } = props;
        const row = this.createRowDom();
        await this.updateRowDom(row, props);
    
        return row;
    }
    
}