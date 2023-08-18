import { computed, ref, watch } from "vue";
import styles from "./styles.module.scss";
import { state } from "@/state";
import { preferences } from "@/preferences";

export const container = document.createElement("div");
container.classList.add(styles.container);

const dataView = document.createElement("div");
dataView.classList.add(styles["data-view"]);
container.appendChild(dataView);

const scrollView = document.createElement("div");
scrollView.classList.add(styles["scroll-view"]);
container.appendChild(scrollView);

const bytesPerRow = 16;
const rowHeight = 16;

const fileRowCount = computed(()=>{
    return Math.ceil( (state.currentFile?.buffer?.byteLength ?? 0) / bytesPerRow);
});

const viewportRowCount = ref(0);
const topRow = ref(0);

watch(viewportRowCount,()=>{
    updateDom();
})

watch(topRow,()=>{
    updateDom();
})

watch(state, ()=>{
    updateDom();
    redrawAll();
})

container.addEventListener("scroll",()=>{
    const scrollPercent = container.scrollTop / container.scrollHeight;
    topRow.value = Math.ceil(fileRowCount.value * scrollPercent);
})

interface Row {
    container: HTMLElement
    bytes: HTMLElement[]
    printables: HTMLElement[]
    startByte: HTMLElement
}

const rowMap = new Map<number, Row>();

function redrawAll(){
    for(let renderIndex = 0; renderIndex < viewportRowCount.value; renderIndex++){
        const index = topRow.value + renderIndex;
        const startByte = index * bytesPerRow;
        const row = rowMap.get(startByte);
        if (!row){
            continue;
        }
        updateRowDom(row,{
            startByte,
            renderIndex
        });
    }
}

function collectGarbage(){
    for (let startByte of rowMap.keys()){
        const rowIndex = Math.floor(startByte / bytesPerRow);
        const start = topRow.value;
        const end = topRow.value + viewportRowCount.value;
        const isVisible = rowIndex >= start && rowIndex < end;
        if (!isVisible){
            rowMap.get(startByte)?.container.remove();
            rowMap.delete(startByte);
        }
    }
}

function updateDom(){
    
    scrollView.style.setProperty('--row-count',fileRowCount.value.toString());
    for(let renderIndex = 0; renderIndex < viewportRowCount.value; renderIndex++){
        const index = topRow.value + renderIndex;
        const startByte = index * bytesPerRow;
        let row: Row | undefined = rowMap.get(startByte);

        if (!row){
            row = recycleOrCreateRow({
                renderIndex,
                startByte
            });
        }

        if (row){
            row.container.style.setProperty('--index',renderIndex.toString());
        }
    }
    collectGarbage();
}

function getBytes(startByte: number): Uint8Array {
    const buffer = state.currentFile?.buffer.slice(startByte, startByte+bytesPerRow);
    const bytes = buffer ? new Uint8Array(buffer) : new Uint8Array(16);
    return bytes;
}

interface Printable {
    text: string
    type: "ascii" | "control" | "other"
}

function toHex(n: number){
    if (preferences.case == 'upper') {
        return n.toString(16).toUpperCase();
    }
    return n.toString(16).toLowerCase();
}

function byteToPrintable(byte: number): Printable {
    const isNormalAscii = (byte >= 33 && byte <= 126);
    const isExtenedAscii = (byte >= 128 && byte <= 254);
    const isControlCharacter = (byte >= 0 && byte <= 32);

    if (isNormalAscii){
        return {
            text: String.fromCharCode(byte),
            type: "ascii"
        };
    }
    if (isControlCharacter){
        return {
            text: String.fromCodePoint(byte + 0x2400),
            type: "control"
        };
    }
    else {
        return {
            text: '.',
            type: "other"
        };
    }
}

function takeGarbageRow(){
    for (let startByte of rowMap.keys()){
        const rowIndex = Math.floor(startByte / bytesPerRow);
        const start = topRow.value;
        const end = topRow.value + viewportRowCount.value;
        const isVisible = rowIndex >= start && rowIndex < end;
        if (isVisible){
            continue;
        }
        const row = rowMap.get(startByte);
        if (row?.bytes.length != bytesPerRow){
            continue;
        }
        rowMap.delete(startByte);
        return row;
    }
}

function recycleOrCreateRow(props:
    { renderIndex: number, startByte: number }
){
    const recycled = recycleRow(props);
    if (!recycled){
        return createNewRow(props);
    }
    return recycled;
}

function recycleRow(props:
    { renderIndex: number, startByte: number }
){
    const { renderIndex, startByte } = props;
    const row = takeGarbageRow();

    if (!row){
        return;
    }

    updateRowDom(row,props);

    return row;
}

function updateRowDom(row: Row, props:
    { renderIndex: number, startByte: number }
) {
    const { renderIndex, startByte } = props;

    const { container } = row;

    container.dataset["index"] = renderIndex.toString();
    container.style.setProperty("--index",renderIndex.toString());

    const count = toHex(startByte).padStart(8,'0');
    row.startByte.innerText = count;

    const bytes = [...getBytes(startByte)];
    for (let i = 0; i < row.bytes.length; i++){
        const byte: number | undefined = bytes[i];
        if (byte == undefined){
            row.bytes[i].innerText = '';
            continue;
        }
        row.bytes[i].innerText = toHex(byte).padStart(2,'0');
    }
    const printables = bytes.map(byteToPrintable);
    for (let i = 0; i < row.printables.length; i++){
        const printable: Printable | undefined = printables[i];
        if (!printable){
            row.printables[i].innerText = '';
            row.printables[i].dataset["type"] = "undefined";
            continue;
        }
        row.printables[i].innerText = printable.text;
        row.printables[i].dataset["type"] = printable.type;
    }
    rowMap.set(startByte,row);
}

function createRowDom() {
    console.log("create row dom");

    const container = document.createElement("div");
    container.classList.add(styles.row);

    const startByte = document.createElement("div");
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

    dataView.appendChild(container);

    return {
        container,
        bytes,
        printables,
        startByte
    } satisfies Row;
}

function createNewRow(props:
    { renderIndex: number, startByte: number }
){
    const { renderIndex, startByte } = props;
    const row = createRowDom();
    updateRowDom(row, props);

    return row;
}

function calculateSizes(){
    const rect = container.getBoundingClientRect();
    viewportRowCount.value = Math.floor(rect.height / rowHeight);
}

const resizeObserver = new ResizeObserver((entries) => {
    calculateSizes();
});

resizeObserver.observe(container);