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
})

container.addEventListener("scroll",()=>{
    const scrollPercent = container.scrollTop / container.scrollHeight;
    topRow.value = Math.ceil(fileRowCount.value * scrollPercent);
})

function updateDom(){
    
    scrollView.style.setProperty('--row-count',fileRowCount.value.toString());
    const used: Element[] = [];
    for(let renderIndex = 0; renderIndex < viewportRowCount.value; renderIndex++){
        const index = topRow.value + renderIndex;
        const startByte = index * bytesPerRow;
        let row: HTMLDivElement | null = container.querySelector(`[data-start-byte='${startByte}']`);
        const bytes = getBytesString(startByte);
        if (row && bytes != row.dataset["bytes"]){
            dataView.removeChild(row);
            row = null;
        }

        if (!row){
            row = createRow({
                renderIndex,
                startByte
            });
            dataView.appendChild(row);
        }

        if (row){
            row.style.setProperty('--index',renderIndex.toString());
        }

        used.push(row);
    }
    const remove: Element[] = [];
    for (let child of dataView.children){
        if (!used.includes(child)){
            remove.push(child);
        }
    }
    for (let r of remove){
        dataView.removeChild(r);
    }
}

function getBytesString(startByte: number){
    return [...getBytes(startByte)].join(",");
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

function createRow(props:
    { renderIndex: number, startByte: number }
){
    const { renderIndex, startByte } = props;

    const row = document.createElement("div");
    row.classList.add(styles.row);
    row.dataset["index"] = renderIndex.toString();
    row.dataset["bytes"] = getBytesString(startByte);
    row.dataset["startByte"] = startByte.toString();
    row.style.setProperty("--index",renderIndex.toString());

    const byteCounter = document.createElement("div");
    byteCounter.classList.add(styles.count);
    const count = toHex(startByte).padStart(8,'0');
    byteCounter.innerText = count;
    row.appendChild(byteCounter);

    const bytes = [...getBytes(startByte)];

    const list = document.createElement("div");
    list.classList.add(styles.list);
    bytes.forEach(byte=>{
        const text = toHex(byte).padStart(2,'0');
        const element = document.createElement("button");
        element.innerText = text;
        list.appendChild(element);
    })
    row.appendChild(list);

    const text = document.createElement("div");
    text.classList.add(styles.text);
    const printables = bytes.map(byteToPrintable);
    printables.forEach(printable=>{
        const element = document.createElement("button");
        element.innerText = printable.text;
        element.dataset["type"] = printable.type;
        text.appendChild(element);
    })
    row.appendChild(text);

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