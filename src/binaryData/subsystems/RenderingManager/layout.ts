import type { Styles } from "./styles";
import { BoundingBox, CachedBoundingBox } from "./box";
import type { Sizes } from "./sizes";
import { toHex } from "@/binaryData/row";
import type { DataProvider } from "@/binaryData/dataProvider";

interface LayoutDependencies {
    width: number
    height: number
    styles: Styles
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
    sizes: Sizes
    dataProvider: DataProvider
}

type BoxCaches = Map<string,Map<unknown,BoundingBox>>;

export class Layout {
    sizes: Sizes;
    styles: Styles;
    bytesPerRow = 16;
    viewportRowCount: number;
    unit: number;
    width: number;
    height: number;
    rowHeight: number = 16;
    boxCaches: BoxCaches = new Map();
    ctx: CanvasRenderingContext2D;
    dataProvider: DataProvider;

    constructor(deps: LayoutDependencies) {
        this.styles = deps.styles;
        this.viewportRowCount = Math.floor(deps.height / this.rowHeight) + 1;
        this.unit = deps.sizes.unit;
        this.width = deps.width;
        this.height = deps.height;
        this.ctx = deps.ctx;
        this.sizes = deps.sizes;
        this.dataProvider = deps.dataProvider;
    }
    documentEndIndex(){
        return this.dataProvider.size-1;
    }
    getByteCountDigitCount(){
        const min = this.styles.minRowNumberDigitCount;
        const end = toHex(this.documentEndIndex()).length;
        return Math.max(min,end);
    }
    getPaddedByteCount(count: number){
        return toHex(count).padStart(this.getByteCountDigitCount(),'0');
    }
    getRowPosition(y: number){
        return y * this.rowHeight;
    }
    byteCountContainer = new CachedBoundingBox(()=>{
        const anyByteCount = this.anyByteCountBox.value;
        
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: anyByteCount.outer.width,
            innerHeight: this.height,
            paddingLeft: 4 * this.unit,
            paddingRight: 4 * this.unit
        })
    })
    anyByteCountBox = new CachedBoundingBox(()=>{
        const ctx = this.ctx;
        const count = this.getByteCountDigitCount();
        ctx.font = this.styles.getByteCountFont();
        const text = this.getPaddedByteCount(count);
        const size = ctx.measureText(text);
        const textWidth = size.width;
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: textWidth,
            innerHeight: this.rowHeight * this.unit,
            paddingLeft: 4 * this.unit,
            paddingRight: 4 * this.unit
        })
    })
    createByteCountBox(y: number){
        const container = this.byteCountContainer.value;
        const anyByteCount = this.anyByteCountBox.value;
    
        return new BoundingBox({
            outerLeft: container.inner.left,
            outerTop: container.inner.top + this.getRowPosition(y) * this.unit,
            innerWidth: anyByteCount.inner.width,
            innerHeight: anyByteCount.inner.height,
            paddingLeft: anyByteCount.paddingLeft,
            paddingRight: anyByteCount.paddingRight,
        })
    }
    getByteCountBox(y: number): BoundingBox {
        return this.getCachedBox("byteCount",y,this.createByteCountBox.bind(this,y));
    }
    bytesContainer = new CachedBoundingBox(()=>{
        const count = this.byteCountContainer.value;
        const anyByte = this.anyByteBox.value;

        return new BoundingBox({
            outerLeft: count.outer.right,
            outerTop: 0,
            innerWidth: anyByte.outer.width * this.bytesPerRow,
            innerHeight: this.rowHeight * this.unit,
            paddingLeft: 6 * this.unit,
            paddingRight: 6 * this.unit,
        })
    })
    getCachedBox(cacheId: string, key: unknown, create: ()=>BoundingBox): BoundingBox {
        let map = this.boxCaches.get(cacheId);
        if (!map){
            map = new Map();
            this.boxCaches.set(cacheId,map);
        }
        let item = map.get(key);
        if (!item) {
            item = create();
            map.set(key,item);
        }
        return item;
    }
    anyByteBox = new CachedBoundingBox(()=>{
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: this.styles.editorByteWidth * this.unit,
            innerHeight: this.rowHeight * this.unit,
        })
    })
    getByteBoxId(y: number,x: number){
        return y * this.bytesPerRow + x;
    }
    createByteBox(y: number,x: number){
        const bytesContainer = this.bytesContainer.value;
        const anyByte = this.anyByteBox.value;

        return new BoundingBox({
            outerLeft: bytesContainer.inner.left + x * anyByte.outer.width,
            outerTop: bytesContainer.inner.top + y * anyByte.outer.height,
            innerWidth: anyByte.inner.width,
            innerHeight: anyByte.inner.height,
        })
    }
    getByteBox(y: number,x: number): BoundingBox {
        const id = this.getByteBoxId(y,x);
        return this.getCachedBox("bytes",id,this.createByteBox.bind(this,y,x));
    }
    anyCharBox = new CachedBoundingBox(()=>{
        const charWidth = this.styles.editorCharWidth * this.unit;
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: charWidth,
            innerHeight: this.rowHeight * this.unit
        })
    })
    charsContainer = new CachedBoundingBox(()=>{
        const pos = this.bytesContainer.value;
        const anyCharBox = this.anyCharBox.value;
    
        return new BoundingBox({
            outerLeft: pos.outer.right,
            outerTop: 0,
            innerWidth: anyCharBox.inner.width * this.bytesPerRow,
            innerHeight: this.height,
            paddingLeft: 6 * this.unit,
            paddingRight: 6 * this.unit,
        })
    })
    createCharBox(y: number,x: number){
        const top = this.getRowPosition(y);
        const charsBox = this.charsContainer.value;
        const anyCharBox = this.anyCharBox.value;
    
        return new BoundingBox({
            outerLeft: charsBox.inner.left + anyCharBox.outer.width * x,
            outerTop: top * this.unit,
            innerWidth: anyCharBox.inner.width,
            innerHeight: anyCharBox.inner.height
        })
    }
    getCharBox(y: number,x: number): BoundingBox {
        const id = y * this.bytesPerRow + x;
        return this.getCachedBox("chars",id,this.createCharBox.bind(this,y,x));
    }
}