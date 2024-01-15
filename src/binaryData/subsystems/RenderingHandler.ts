import { Editor } from "../editor";
import { bytesPerRow, rowHeight } from "../constants";
import { getRowIndex, toHex, type Row, byteToPrintable } from "../row";
import { emptyCssCache, getCssBoolean, getCssNumber, getCssString } from "@/theme";
import { defineSubsystem } from "../composition";

export interface Point {
    x: number
    y: number
}

export class Dot {
    x: number
    y: number

    constructor({
        x,
        y
    }: {x: number, y: number}){
        this.x = x;
        this.y = y;
    }

    get arr(): [number, number] {
        return [this.x,this.y];
    }
}

export class Box {
    left!: number
    right!: number
    top!: number
    bottom!: number

    constructor(props: {
        left: number
        right: number
        top: number
        bottom: number
    }) {
        Object.assign(this,props);
    }
    
    get width(){
        return this.right - this.left;
    }
    get height(){
        return this.bottom - this.top;
    }
    get center(){
        return new Dot({
            x: this.left + this.width / 2,
            y: this.top + this.height / 2
        })
    }
    get arr(): [number, number, number, number] {
        return [
            this.left,
            this.top,
            this.width,
            this.height
        ]
    }
}

class BoundingBox {
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    paddingBottom: number;
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
    innerWidth: number;
    innerHeight: number;

    constructor(props: {
        outerLeft: number,
        outerTop: number,
        innerWidth: number,
        innerHeight: number,
        paddingLeft?: number,
        paddingRight?: number,
        paddingTop?: number,
        paddingBottom?: number,
        marginLeft?: number,
        marginRight?: number,
        marginTop?: number,
        marginBottom?: number
    }){
        const {
            outerLeft,
            outerTop,
            innerWidth,
            innerHeight
        } = props;
        this.paddingLeft = props.paddingLeft ?? 0;
        this.paddingRight = props.paddingRight ?? 0;
        this.paddingTop = props.paddingTop ?? 0;
        this.paddingBottom = props.paddingBottom ?? 0;
        this.marginLeft = props.marginLeft ?? 0;
        this.marginRight = props.marginRight ?? 0;
        this.marginTop = props.marginTop ?? 0;
        this.marginBottom = props.marginBottom ?? 0;
        this.outerLeft = outerLeft;
        this.outerTop = outerTop;
        this.innerWidth = innerWidth;
        this.innerHeight = innerHeight;
    }
    
    // outer -> border -> inner
    outerLeft: number;
    get borderLeft(){ return this.outerLeft + this.marginLeft; }
    get innerLeft(){ return this.borderLeft + this.paddingLeft; }

    // inner <- border <- outer
    get innerRight(){ return this.innerLeft + this.innerWidth; }
    get borderRight(){ return this.innerRight + this.paddingRight; }
    get outerRight(){ return this.borderRight + this.marginRight; }

    // outer -> border -> inner
    outerTop: number;
    get borderTop() { return this.outerTop + this.marginTop; }
    get innerTop() { return this.borderTop + this.paddingTop; }

    // inner <- border <- outer
    get innerBottom() { return this.innerTop + this.innerHeight; }
    get borderBottom() { return this.innerBottom + this.paddingBottom; }
    get outerBottom() { return this.borderBottom + this.marginBottom; }

    get inner(): Box {
        return new Box({
            left: this.innerLeft,
            right: this.innerRight,
            top: this.innerTop,
            bottom: this.innerBottom
        });
    }
    get border(): Box {
        return new Box({
            left: this.borderLeft,
            right: this.borderRight,
            top: this.borderTop,
            bottom: this.borderBottom
        });
    }
    get outer(): Box {
        return new Box({
            left: this.outerLeft,
            right: this.outerRight,
            top: this.outerTop,
            bottom: this.outerBottom
        });
    }
}

export const RenderingHandler = defineSubsystem({
    name: "RenderingHandler",
    init(this: Editor) {
        const bytesPerRow = 16;

        return {
            bytesPerRow,
            rows: new Set<Row>()
        };
    },
    proto: {
        renderPosToFileIndex(this: Editor, y: number, x: number): number {
            return this.pointToFileIndex({x,y});
        },
        pointToFileIndex(this: Editor, pos: Point): number {
            const index = (this.intermediateState.value.topRow + pos.y) * bytesPerRow + pos.x;
            return index;
        },
        getRenderIndex(this: Editor, startByte: number): number {
            const index = getRowIndex(startByte);
            const renderIndex = index - this.intermediateState.value.topRow;
            return renderIndex;
        },
        isRenderIndexInViewport(this: Editor, index: number): boolean {
            return index >= 0 && index < this.viewportRowCount.value;
        },
        render(this: Editor): void {
            emptyCssCache();
            this.innerContainer.dataset["scrollType"] = `${this.scrollBarType.value}`;
            if (this.scrollBarType.value == "virtual"){
                this.element.scrollTop = 0;
            }
            this.scrollView.style.setProperty('--row-count',this.scrollRowCount.value.toString());
            
            this.draw();
        
            this.renderedState.value = this.intermediateState.value;
        },
        draw(this: Editor): void {
            const ctx = this.ctx;
            const canvas = this.canvas;
        
            this.canvas.width = this.intermediateState.value.width;
            this.canvas.height = this.intermediateState.value.height;
            this.canvas.style.setProperty("--device-pixel-ratio",window.devicePixelRatio.toString())
        
            ctx.fillStyle = getCssString(this.innerContainer,"--editor-background-color");
            ctx.fillRect(0,0,canvas.width,canvas.height);
        
            {
                const box = this.getByteCountContainer();
                ctx.strokeStyle = getCssString(this.innerContainer,"--editor-border-color");
                ctx.strokeRect(...box.border.arr);
                ctx.fillStyle = getCssString(this.innerContainer,"--editor-row-number-background-color");
                ctx.fillRect(...box.border.arr);
            }
            {
                const box = this.getCharsContainer();
                ctx.strokeStyle = getCssString(this.innerContainer,"--editor-border-color");
                ctx.strokeRect(...box.border.arr);
                ctx.fillStyle = getCssString(this.innerContainer,"--editor-background-color");
                ctx.fillRect(...box.border.arr);
            }
        
            for(let renderIndex = 0; renderIndex < this.viewportRowCount.value; renderIndex++){
                this.drawRow(renderIndex);
            }
        },
        drawRow(this: Editor, renderIndex: number): void {
            this.drawByteCount(renderIndex);
        
            for(let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++){
                const value = this.getRenderByte(renderIndex * bytesPerRow + byteIndex);
                this.drawByte({
                    renderIndex,
                    byteIndex,
                    value
                })
                this.drawChar({
                    renderIndex,
                    byteIndex,
                    value
                })
            }
        },
        getScale(this: Editor): number {
            return window.devicePixelRatio;
        },
        getRowPosition(this: Editor, y: number){
            return y * rowHeight;
        },
        getByteCountContainer(this: Editor): BoundingBox {
            const anyByteCount = this.getAnyByteCountBox();
            
            return new BoundingBox({
                outerLeft: 0,
                outerTop: 0,
                innerWidth: anyByteCount.outer.width,
                innerHeight: this.canvas.height,
                paddingLeft: 4 * this.getScale(),
                paddingRight: 4 * this.getScale()
            })
        },
        getAnyByteCountBox(this: Editor){
            const ctx = this.ctx;
        
            const count = this.getByteCountOfRow(this.viewportRowCount.value);
            ctx.font = this.getByteCountFont();
            const text = this.getPaddedByteCount(count);
            const size = ctx.measureText(text);
            const textWidth = size.width;
            return new BoundingBox({
                outerLeft: 0,
                outerTop: 0,
                innerWidth: textWidth,
                innerHeight: rowHeight * this.getScale(),
                paddingLeft: 4 * this.getScale(),
                paddingRight: 4 * this.getScale()
            })
        },
        getByteCountBox(this: Editor, y: number): BoundingBox {
            const container = this.getByteCountContainer();
            const anyByteCount = this.getAnyByteCountBox();
        
            return new BoundingBox({
                outerLeft: container.inner.left,
                outerTop: container.inner.top + this.getRowPosition(y) * this.getScale(),
                innerWidth: anyByteCount.inner.width,
                innerHeight: anyByteCount.inner.height,
                paddingLeft: anyByteCount.paddingLeft,
                paddingRight: anyByteCount.paddingRight,
            })
        },
        getBytesContainer(this: Editor){
            const count = this.getByteCountContainer();
            const anyByte = this.getAnyByteBox();

            return new BoundingBox({
                outerLeft: count.outer.right,
                outerTop: 0,
                innerWidth: anyByte.outer.width * this.bytesPerRow,
                innerHeight: rowHeight * this.getScale(),
                paddingLeft: 6 * this.getScale(),
                paddingRight: 6 * this.getScale(),
            })
        },
        getAnyByteBox(this: Editor): BoundingBox {
            return new BoundingBox({
                outerLeft: 0,
                outerTop: 0,
                innerWidth: getCssNumber(this.innerContainer,"--editor-byte-width") * this.getScale(),
                innerHeight: rowHeight * this.getScale(),
            })
        },
        getByteRect(this: Editor, y: number,x: number): BoundingBox {
            const bytesContainer = this.getBytesContainer();
            const anyByte = this.getAnyByteBox();

            return new BoundingBox({
                outerLeft: bytesContainer.inner.left + x * anyByte.outer.width,
                outerTop: bytesContainer.inner.top + y * anyByte.outer.height,
                innerWidth: anyByte.inner.width,
                innerHeight: anyByte.inner.height,
            })
        },
        getAnyCharBox(this: Editor): BoundingBox {
            const charWidth = getCssNumber(this.innerContainer,"--editor-char-width") * this.getScale();
            return new BoundingBox({
                outerLeft: 0,
                outerTop: 0,
                innerWidth: charWidth,
                innerHeight: rowHeight * this.getScale()
            })
        },
        getCharsContainer(this: Editor){
            const pos = this.getBytesContainer();
            const anyCharBox = this.getAnyCharBox();
        
            return new BoundingBox({
                outerLeft: pos.outer.right,
                outerTop: 0,
                innerWidth: anyCharBox.inner.width * this.bytesPerRow,
                innerHeight: this.canvas.height,
                paddingLeft: 6 * this.getScale(),
                paddingRight: 6 * this.getScale(),
            })
        },
        getCharRect(this: Editor, y: number,x: number): BoundingBox {
            const top = this.getRowPosition(y);
            const charsBox = this.getCharsContainer();
            const anyCharBox = this.getAnyCharBox();
        
            return new BoundingBox({
                outerLeft: charsBox.inner.left + anyCharBox.outer.width * x,
                outerTop: top * this.getScale(),
                innerWidth: anyCharBox.inner.width,
                innerHeight: anyCharBox.inner.height
            })
        },
        getByteCountOfRow(this: Editor, renderIndex: number){
            return renderIndex + this.intermediateState.value.topRow;
        },
        getPaddedByteCount(this: Editor, count: number){
            return toHex(count).padStart(getCssNumber(this.innerContainer,"--editor-row-number-digit-count"),'0');
        },
        getByteCountFont(this: Editor) {
            return `${getCssNumber(this.innerContainer,"--editor-font-size") * this.getScale()}px ${getCssString(this.innerContainer,"--editor-font-family")}`
        },
        drawHover(this: Editor, box: Box){
            const ctx = this.ctx;
            ctx.strokeStyle = getCssString(this.innerContainer,"--editor-select-border-color");
            ctx.lineWidth = 1*this.getScale();
            ctx.strokeRect(...box.arr);
        },
        drawCursor(this: Editor, box: Box){
            const ctx = this.ctx;
            ctx.strokeStyle = getCssString(this.innerContainer,"--editor-cursor-border-color");
            ctx.lineWidth = 1*this.getScale();
            ctx.strokeRect(...box.arr);
        },
        drawSelection(this: Editor, box: Box){
            const ctx = this.ctx;
            ctx.fillStyle = getCssString(this.innerContainer,"--editor-cursor-background-color");
            ctx.fillRect(...box.arr);
        },
        drawByteCount(this: Editor, renderIndex: number): void {
            const ctx = this.ctx;
        
            const count = this.getByteCountOfRow(renderIndex);
        
            const text = this.getPaddedByteCount(count);
            ctx.font = this.getByteCountFont();
            
            const pos = this.getByteCountBox(renderIndex);
        
            if (getCssBoolean(this.element,"--editor-show-wireframe")){
                ctx.strokeStyle = "green";
                ctx.lineWidth = 1*this.getScale();
                ctx.strokeRect(...pos.inner.arr);
            }
        
            ctx.fillStyle = getCssString(this.innerContainer,"--editor-row-number-foreground-color");
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text,...pos.inner.center.arr);

            if (
                this.currentHover.type == "byte-count"
                && this.currentHover.y == renderIndex
            ){
                this.drawHover(pos.border);
            }
        },
        drawByte(this: Editor, props: { renderIndex: number, byteIndex: number, value: number | undefined }): void {
            const ctx = this.ctx;
            const { value, renderIndex, byteIndex } = props;
        
            if (value == undefined){
                return;
            }
        
            const pos = this.getByteRect(renderIndex,byteIndex);
            const index = this.renderPosToFileIndex(renderIndex,byteIndex);
        
            if (this.isSelectedIndex(index)){
                this.drawSelection(pos.border);
            }

            if (this.cursorPosition == index){
                this.drawCursor(pos.border);
            }
            

            if (getCssBoolean(this.element,"--editor-show-wireframe")){
                ctx.strokeStyle = "red";
                ctx.lineWidth = 1*this.getScale();
                ctx.strokeRect(...pos.border.arr);
            }
        
            const text = toHex(value).padStart(2,'0');
            ctx.font = `${getCssNumber(this.innerContainer,"--editor-font-size") * this.getScale()}px ${getCssString(this.innerContainer,"--editor-font-family")}`;
            ctx.fillStyle = byteIndex % 2 == 0 ?
                getCssString(this.innerContainer,"--editor-byte-1-foreground-color") :
                getCssString(this.innerContainer,"--editor-byte-2-foreground-color")
            ;
        
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text, ...pos.inner.center.arr);

            if (
                (
                    this.currentHover.type == "byte"
                    || this.currentHover.type == "char"
                )
                && this.currentHover.pos.x == byteIndex
                && this.currentHover.pos.y == renderIndex
            ){
                this.drawHover(pos.border);
            }
        },
        drawChar(this: Editor, props: { renderIndex: number, byteIndex: number, value: number | undefined }): void {
            const ctx = this.ctx;
        
            const { value, renderIndex, byteIndex } = props;
        
            if (value == undefined){
                return;
            }

            const pos = this.getCharRect(renderIndex,byteIndex);

            const index = this.renderPosToFileIndex(renderIndex,byteIndex);

            if (this.isSelectedIndex(index)){
                this.drawSelection(pos.border);
            }

            if (this.cursorPosition == index){
                this.drawCursor(pos.border);
            }
        
            if (getCssBoolean(this.element,"--editor-show-wireframe")){
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 1*this.getScale();
                ctx.strokeRect(...pos.border.arr);
            }
        
            const printable = byteToPrintable(value);
            const text = printable.text;
            ctx.font = `${getCssNumber(this.innerContainer,"--editor-font-size") * this.getScale()}px ${getCssString(this.innerContainer,"--editor-font-family")}`;
        
            ctx.fillStyle = getCssString(this.innerContainer,`--editor-char-${printable.type}-color`);
        
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text, ...pos.inner.center.arr);

            if (
                (
                    this.currentHover.type == "byte"
                    || this.currentHover.type == "char"
                )
                && this.currentHover.pos.x == byteIndex
                && this.currentHover.pos.y == renderIndex
            ){
                this.drawHover(pos.border);
            }
        }
    }
});
