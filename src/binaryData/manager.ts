import { computed, ref, watch } from "vue";
import styles from "./styles.module.scss";
import { state } from "@/state";
import { preferences } from "@/preferences";
import upIcon from '@/assets/icons/chevron-up.svg?raw';
import downIcon from '@/assets/icons/chevron-down.svg?raw';

export const container = document.createElement("div");
container.classList.add(styles.container);

const dataView = document.createElement("div");
dataView.classList.add(styles["data-view"]);
container.appendChild(dataView);

const scrollView = document.createElement("div");
scrollView.classList.add(styles["scroll-view"]);
container.appendChild(scrollView);

const scrollBar = document.createElement("div");
scrollBar.classList.add(styles["scroll-bar"]);
container.appendChild(scrollBar);

const upArrow = document.createElement("button");
upArrow.classList.add(styles["up-arrow"]);
upArrow.innerHTML = upIcon;

const downArrow = document.createElement("button");
downArrow.classList.add(styles["down-arrow"]);
downArrow.innerHTML = downIcon;

const scrollBarTrack = document.createElement("div");
scrollBarTrack.classList.add(styles["scroll-bar-track"]);
const scrollBarTrackPadding = document.createElement("div");
scrollBarTrackPadding.classList.add(styles["scroll-bar-track-padding"]);

scrollBar.appendChild(upArrow);
scrollBar.appendChild(scrollBarTrack);
scrollBar.appendChild(scrollBarTrackPadding);
scrollBar.appendChild(downArrow);

const scrollBarHandle = document.createElement("button");
scrollBarHandle.classList.add(styles["scroll-bar-handle"]);
scrollBarTrack.appendChild(scrollBarHandle);

interface ScrollStart {
    y: number
    scrollPercent: number
}

let scrollStart: ScrollStart | null = null;
let scrollPercent = 0;
scrollBarHandle.addEventListener("mousedown",(e)=>{
    scrollStart = {
        y: e.clientY,
        scrollPercent
    };
})


const queueMap = new Map();
function queue(key: string, f: (...a: any)=>any, ms: number){
    if (queueMap.has(key)){
        clearTimeout(queueMap.get(key));
        queueMap.delete(key);
    }
    const timeout = setTimeout(f,ms);
    queueMap.set(key,timeout);
}

const drawQueueMap = new Map();
function drawQueue(key: string, f: (...a: any)=>any){
    const id = Math.random();
    drawQueueMap.set(key,id);
    requestAnimationFrame(()=>{
        if (drawQueueMap.get(key) == id){
            f();
        }
    })
}

let lastUpdateRequest = Date.now();
let lastUpdate = lastUpdateRequest;
function drawLoop(){
    if (lastUpdate < lastUpdateRequest){
        updateDom();
        lastUpdate = Date.now();
    }
    requestAnimationFrame(drawLoop);
}
drawLoop();

function requestDomUpdate(){
    lastUpdateRequest = Date.now();
}

window.addEventListener("mousemove",(e)=>{
    if (!scrollStart){
        return;
    }
    const diff = e.clientY - scrollStart.y;
    const height = scrollBarTrack.clientHeight;
    const percent = diff/height + scrollStart.scrollPercent;
    scrollPercent = Math.max(0,Math.min(percent,1));
    queue("scroll",()=>{
        let newValue = Math.ceil(fileRowCount.value * scrollPercent);
        if (topRow.value != newValue){
            topRow.value = newValue;
        }
        console.log("scroll",scrollPercent,topRow.value,fileRowCount.value);
    },2);
    scrollBar.style.setProperty("--scroll-percent",scrollPercent.toString());
})
window.addEventListener("mouseup",()=>{
    scrollStart = null;
})

const bytesPerRow = 16;
const rowHeight = 16;

const fileRowCount = computed(()=>{
    return Math.ceil( (state.currentFile?.blob.size ?? 0) / bytesPerRow);
});

const scrollRowCount = computed(()=>{
    return Math.min(10000, fileRowCount.value);
})

const scrollBarType = computed(()=>{
    if (fileRowCount.value > 10000){
        return "virtual";
    }
    return "native";
})

const viewportRowCount = ref(0);
const topRow = ref(0);

watch(viewportRowCount,()=>{
    requestDomUpdate();
})

watch(topRow,()=>{
    requestDomUpdate();
})

watch(state, ()=>{
    updateDom();
    redrawAll();
})

container.addEventListener("scroll",()=>{
    const scrollPercent = container.scrollTop / ( container.scrollHeight - (container.clientHeight / 2) );
    topRow.value = Math.ceil(fileRowCount.value * scrollPercent);
})

container.addEventListener("wheel",(e)=>{
    if (scrollBarType.value == "native"){
        return;
    }
    const delta = e.deltaY;
    const deltaRow = Math.round(delta / rowHeight);
    topRow.value += deltaRow;
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
(globalThis as any).redrawAll = redrawAll;

function getRowIndex(startByte: number){
    return Math.floor(startByte / bytesPerRow);
}

const overScollTop = 0;
const overScollBottom = 0;
function shouldRemove(startByte: number){
    const rowIndex = getRowIndex(startByte);
    const start = topRow.value - overScollTop;
    const end = topRow.value + viewportRowCount.value + overScollBottom;
    const isVisible = rowIndex >= start && rowIndex < end;
    return !isVisible;
}

function collectGarbage(){
    for (let startByte of rowMap.keys()){
        if (shouldRemove(startByte)){
            rowMap.get(startByte)?.container.remove();
            rowMap.delete(startByte);
        }
    }
}
function updateDom(){
    container.dataset["scrollType"] = `${scrollBarType.value}`;
    scrollView.style.setProperty('--row-count',scrollRowCount.value.toString());
    const top = (topRow.value % 1024);
    const shift = topRow.value - top;
    dataView.style.setProperty('--top',top.toString());
    console.group("update");
    console.log(rowMap);
    for(let renderIndex = 0; renderIndex < viewportRowCount.value; renderIndex++){
        const index = topRow.value + renderIndex;
        const startByte = index * bytesPerRow;
        console.log(index,!!rowMap.get(startByte));
        const row: Row = rowMap.get(startByte) ?? recycleOrCreateRow({
            renderIndex,
            startByte
        });
        const shiftedIndex = index - shift;
        row.container.style.setProperty('--index',shiftedIndex.toString());
    }
    console.groupEnd();
    collectGarbage();
}
(globalThis as any).updateDom = updateDom;

async function getBytes(startByte: number): Promise<Uint8Array> {
    const buffer = await state.currentFile?.slice(startByte, startByte+bytesPerRow);
    const bytes = buffer ? new Uint8Array(buffer) : new Uint8Array(0);
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
        if (!shouldRemove(startByte)){
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
    console.log("recycled");
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
    rowMap.set(startByte,row);

    const { container } = row;

    const index = getRowIndex(startByte);
    const top = (topRow.value % 1024);
    const shift = topRow.value - top;
    const shiftedIndex = index - shift;
    container.dataset["index"] = index.toString();
    container.style.setProperty("--index",shiftedIndex.toString());

    const count = toHex(startByte).padStart(8,'0');
    row.startByte.innerText = count;

    getBytes(startByte).then((bytes)=>{
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

function createRowDom() {
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