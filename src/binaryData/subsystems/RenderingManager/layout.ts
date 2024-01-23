import type { Styles } from "./styles";
import type { Sizes } from "./sizes";
import { toHex } from "@/binaryData/row";
import type { DataProvider } from "@/binaryData/dataProvider";
import { byteCountContainer } from "./layout/byteCountContainer";
import { anyByteCountBox } from "./layout/anyByteCountBox";
import { byteCountBox } from "./layout/byteCountBox";
import { bytesContainer } from "./layout/bytesContainer";
import { anyByteBox } from "./layout/anyByteBox";
import { byteBox } from "./layout/byteBox";
import { anyCharBox } from "./layout/anyCharBox";
import { charsContainer } from "./layout/charsContainer";
import { charBox } from "./layout/charBox";

interface LayoutDependencies {
    width: number
    height: number
    styles: Styles
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
    sizes: Sizes
    dataProvider: DataProvider
}

export class Layout {
    sizes: Sizes;
    styles: Styles;
    bytesPerRow: number = 16;
    rowHeight: number = 16;
    viewportRowCount: number;
    unit: number;
    width: number;
    height: number;
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
    yxToScalar(y: number, x: number){
        return y * this.bytesPerRow + x;
    }

    byteCountContainer = byteCountContainer(this);
    bytesContainer = bytesContainer(this);
    charsContainer = charsContainer(this);

    anyByteCountBox = anyByteCountBox(this);
    byteCountBox = byteCountBox(this);

    anyByteBox = anyByteBox(this);
    byteBox = byteBox(this);

    anyCharBox = anyCharBox(this);
    charBox = charBox(this);
}