import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { bytesPerRow, rowHeight } from "../constants";
import { getRowIndex, toHex, type Row, byteToPrintable, type Printable } from "../row";
import styles from "../styles.module.scss";

export function ImplRenderingHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {

        rows = new Set<Row>()

        findRow(startByte: number): Row | undefined {
            return [...this.rows].find(e=>e.startByteNumber === startByte);
        }

        findGarbageRow(): Row | undefined {
            return [...this.rows].find(row=>{
                const renderIndex = this.getRenderIndex(row.startByteNumber);
                return !this.isRenderIndexInViewport(renderIndex);
            });
        }

        updateRowPosition(row: Row){
            const that = this as any as EditorThis;

            const renderIndex = this.getRenderIndex(row.startByteNumber);
            const shiftedIndex = renderIndex + that.topRow.value - this.getShift();
            row.container.style.setProperty('--index',shiftedIndex.toString());
        }

        getShift(): number {
            const that = this as any as EditorThis;

            const top = (that.topRow.value % 1024);
            const shift = that.topRow.value - top;
            return shift;
        }

        collectGarbage(){
            const that = this as any as EditorThis;
            let removeCount = 0;
            for (let row of [...that.rows]){
                const renderIndex = this.getRenderIndex(row.startByteNumber);
                if (!this.isRenderIndexInViewport(renderIndex)){
                    row.container.remove();
                    that.rows.delete(row);
                    removeCount++;
                }
            }
            console.log("removed",removeCount,that.rows.size);
        }

        getRenderIndex(startByte: number): number {
            const that = this as any as EditorThis;

            const index = getRowIndex(startByte);
            const renderIndex = index - that.topRow.value;
            return renderIndex;
        }

        isRenderIndexInViewport(index: number): boolean {
            const that = this as any as EditorThis;
            
            return index >= 0 && index < that.viewportRowCount.value;
        }

        async render(){
            const that = this as any as EditorThis;

            that.element.dataset["scrollType"] = `${that.scrollBarType.value}`;
            if (that.scrollBarType.value == "virtual"){
                that.element.scrollTop = 0;
            }
            that.scrollView.style.setProperty('--row-count',that.scrollRowCount.value.toString());
            
            that.dataView.style.setProperty('--top',(that.topRow.value - this.getShift()).toString());
            const promises: Promise<void>[] = [];

            while(this.rows.size > that.viewportRowCount.value){
                const row = that.findGarbageRow();
                if (!row){
                    break;
                }
                row.container.remove();
                that.rows.delete(row);
            }

            while (this.rows.size < that.viewportRowCount.value){
                const row = that.createRow(-Infinity);
            }
            
            for(let renderIndex = 0; renderIndex < that.viewportRowCount.value; renderIndex++){
                const promise = (async ()=>{
                    const fileIndex = that.topRow.value + renderIndex;
                    const startByte = fileIndex * bytesPerRow;
                    
                    const row = this.findRow(startByte);
                    if (row){
                        this.updateRowPosition(row);
                    }
                    else {
                        let row = this.findGarbageRow();
                        if (row){
                            row.startByteNumber = startByte;
                            await that.updateRow(row);
                        }
                    }
                })()
                promises.push(promise);
            }

            await Promise.all(promises);
        }

        async updateRow(row: Row) {
            const that = this as any as EditorThis;
        
            const count = toHex(row.startByteNumber).padStart(8,'0');
            row.startByte.innerText = count;
        
            const bytes = await that.getBytes(row.startByteNumber);
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

            this.updateRowPosition(row);
        }
    
        createRow(startByteNumber: number) {
            const that = this as any as EditorThis;

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
        
            that.dataView.appendChild(container);
        
            const row = {
                container,
                bytes,
                printables,
                startByte,
                startByteNumber: startByteNumber
            } satisfies Row;
            this.rows.add(row);
    
            return row;
        }
    };

    return chainImpl(cls);
}