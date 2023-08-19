import type { EditorFile } from "@/EditorFile";
import { createDom } from "./dom";
import { DerivedVar, TrackedVar, createDependantFunction } from "./reactivity";
import { computed, watch } from "vue";
import { state } from "@/state";
import { bytesPerRow, rowHeight } from "./constants";
import { getRowIndex, toHex, type Row, type Printable, byteToPrintable } from "./row";
import styles from "./styles.module.scss";
import { registerResizeObserver } from "./resize";

export class Editor {

    viewportRowCount = new TrackedVar(0);
    topRow = new TrackedVar(0);
    currentFile = new TrackedVar<EditorFile | undefined>(undefined);

    fileRowCount = new DerivedVar(()=>{
        return Math.ceil( (this.currentFile.value?.blob.size ?? 0) / bytesPerRow);
    },this.currentFile);

    scrollRowCount = new DerivedVar(()=>{
        return Math.min(10000, this.fileRowCount.value);
    },this.fileRowCount);

    scrollBarType = new DerivedVar(()=>{
        if (this.fileRowCount.value > 10000){
            return "virtual";
        }
        return "native";
    },this.fileRowCount);

    rowMap = new Map<number, Row>();

    element!: HTMLElement
    scrollView!: HTMLElement
    dataView!: HTMLElement

    constructor(){
        createDom(this);
        registerResizeObserver(this);

        this.element.addEventListener("scroll",()=>{
            const scrollPercent = this.element.scrollTop / ( this.element.scrollHeight - (this.element.clientHeight / 2) );
            this.topRow.value = Math.ceil(this.fileRowCount.value * scrollPercent);
            this.updateDom();
        })

        

        this.element.addEventListener("wheel",(e)=>{
            if (this.scrollBarType.value == "native"){
                return;
            }
            const delta = e.deltaY;
            const deltaRow = Math.round(delta / rowHeight);
            let newTopRow = this.topRow.value + deltaRow;
            if (newTopRow < 0){
                newTopRow = 0;
            }
            this.topRow.value = newTopRow;
            this.updateDom();
        })
    }

    reflow(){
        const rect = this.element.getBoundingClientRect();
        this.viewportRowCount.value = Math.floor(rect.height / rowHeight);
        this.updateDom();
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

    updateDom = createDependantFunction(()=>{
        this.element.dataset["scrollType"] = `${this.scrollBarType.value}`;
        if (this.scrollBarType.value == "virtual"){
            this.element.scrollTop = 0;
        }
        this.scrollView.style.setProperty('--row-count',this.scrollRowCount.value.toString());
        const top = (this.topRow.value % 1024);
        const shift = this.topRow.value - top;
        this.dataView.style.setProperty('--top',top.toString());
        console.group("update");
        console.log(this.rowMap);
        for(let renderIndex = 0; renderIndex < this.viewportRowCount.value; renderIndex++){
            const index = this.topRow.value + renderIndex;
            const startByte = index * bytesPerRow;
            console.log(index,!!this.rowMap.get(startByte));
            const row: Row = this.rowMap.get(startByte) ?? this.recycleOrCreateRow({
                renderIndex,
                startByte
            });
            const shiftedIndex = index - shift;
            row.container.style.setProperty('--index',shiftedIndex.toString());
        }
        console.groupEnd();
        this.collectGarbage();
    }, this.topRow, this.currentFile, this.viewportRowCount)

    async getBytes(startByte: number): Promise<Uint8Array> {
        const buffer = await this.currentFile.value?.slice(startByte, startByte+bytesPerRow);
        const bytes = buffer ? new Uint8Array(buffer) : new Uint8Array(0);
        return bytes;
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

    recycleOrCreateRow(props:
        { renderIndex: number, startByte: number }
    ){
        const recycled = this.recycleRow(props);
        if (!recycled){
            return this.createNewRow(props);
        }
        console.log("recycled");
        return recycled;
    }

    recycleRow(props:
        { renderIndex: number, startByte: number }
    ){
        const { renderIndex, startByte } = props;
        const row = this.takeGarbageRow();
    
        if (!row){
            return;
        }
    
        this.updateRowDom(row,props);
    
        return row;
    }

    updateRowDom(row: Row, props:
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
    
        this.getBytes(startByte).then((bytes)=>{
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
        })
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

    createNewRow(props:
        { renderIndex: number, startByte: number }
    ){
        const { renderIndex, startByte } = props;
        const row = this.createRowDom();
        this.updateRowDom(row, props);
    
        return row;
    }
    
}