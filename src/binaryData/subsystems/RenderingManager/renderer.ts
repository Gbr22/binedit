import type { Layout } from "./layout";
import type { State } from "./state";
import type { Styles } from "./styles";
import { Box } from "./box";
import { byteToPrintable, toHex } from "@/binaryData/row";
import { isSelectedIndex } from "../SelectionManager";

interface RendererDependecies {
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
    styles: Styles
    layout: Layout
    state: State
}

export class Renderer {
    layout: Layout;
    styles: Styles;
    state: State;

    get unit() { return this.layout.unit }
    get bytesPerRow() { return this.layout.bytesPerRow }
    get viewportRowCount() { return this.layout.viewportRowCount }
    get positionInFile() { return this.state.positionInFile }
    get rowHeight() { return this.layout.rowHeight }

    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    width: number;
    height: number;

    constructor(deps: RendererDependecies) {
        this.styles = deps.styles;
        this.layout = deps.layout;
        this.state = deps.state;
        this.canvas = deps.canvas;
        this.ctx = deps.ctx;
        this.width = deps.layout.width;
        this.height = deps.layout.height;
    }
    renderPosToFileIndex(y: number, x: number): number {
        return this.pointToFileIndex({x,y});
    }
    pointToFileIndex(pos: {x: number, y: number}): number {
        const index = pos.y * this.bytesPerRow + pos.x + this.positionInFile;
        return index;
    }
    isRenderIndexInViewport(index: number): boolean {
        return index >= 0 && index < this.viewportRowCount;
    }
    draw(): void {
        const ctx = this.ctx;
        const canvas = this.canvas;
    
        ctx.fillStyle = this.styles.editor.backgroundColor;
        ctx.fillRect(0,0,canvas.width,canvas.height);
    
        {
            const box = this.layout.byteCountContainer.value;
            ctx.strokeStyle = this.styles.byteCountContainer.borderColor;
            ctx.strokeRect(...box.border.arr);
            ctx.fillStyle = this.styles.byteCountContainer.backgroundColor;
            ctx.fillRect(...box.border.arr);
        }
        {
            const box = this.layout.charsContainer.value;
            ctx.strokeStyle = this.styles.charsContainer.borderColor;
            ctx.strokeRect(...box.border.arr);
            ctx.fillStyle = this.styles.charsContainer.backgroundColor;
            ctx.fillRect(...box.border.arr);
        }
    
        for(let renderIndex = 0; renderIndex < this.viewportRowCount; renderIndex++){
            this.drawRow(renderIndex);
        }
    }
    getRenderByteFromIndex(index: number){
        return this.state.dataToRender[index];
    }
    drawRow(renderIndex: number): void {
        this.drawByteCount(renderIndex);
    
        for (let byteIndex = 0; byteIndex < this.bytesPerRow; byteIndex++){
            const value = this.getRenderByteFromIndex(renderIndex * this.bytesPerRow + byteIndex);
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
    }
    getByteCountOfRow(renderIndex: number){
        return renderIndex * this.bytesPerRow + this.positionInFile;
    }
    drawHover(box: Box){
        const ctx = this.ctx;
        ctx.strokeStyle = this.styles.hover.borderColor;
        ctx.lineWidth = this.styles.hover.borderWidth*this.unit;
        ctx.strokeRect(...box.arr);
    }
    drawCursor(box: Box){
        const ctx = this.ctx;
        ctx.strokeStyle = this.styles.cursor.borderColor;
        ctx.lineWidth = this.styles.cursor.borderWidth*this.unit;
        ctx.strokeRect(...box.arr);
    }
    drawSelection(box: Box){
        const ctx = this.ctx;
        ctx.fillStyle = this.styles.selection.backgroundColor;
        ctx.fillRect(...box.arr);
    }
    drawByteCount(renderIndex: number): void {
        const ctx = this.ctx;
    
        const count = this.getByteCountOfRow(renderIndex);
    
        const text = this.layout.getPaddedByteCount(count);
        ctx.font = this.styles.byteCount.font;
        
        const pos = this.layout.byteCountBox.get(renderIndex);
    
        if (this.styles.showWireframe){
            ctx.strokeStyle = "green";
            ctx.lineWidth = 1*this.unit;
            ctx.strokeRect(...pos.inner.arr);
        }
    
        ctx.fillStyle = this.styles.byteCount.color;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text,...pos.inner.center.arr);

        if (
            this.state.currentHover.type == "byte-count"
            && this.state.currentHover.y == renderIndex
        ){
            this.drawHover(pos.border);
        }
    }
    drawByte(props: { renderIndex: number, byteIndex: number, value: number | undefined }): void {
        const ctx = this.ctx;
        const { value, renderIndex, byteIndex } = props;
    
        if (value == undefined){
            return;
        }
    
        const pos = this.layout.byteBox.get(renderIndex,byteIndex);
        const index = this.renderPosToFileIndex(renderIndex,byteIndex);
    
        if (isSelectedIndex(index,this.state.pendingSelectionRanges)){
            this.drawSelection(pos.border);
        }

        if (this.state.cursorPosition == index){
            this.drawCursor(pos.border);
        }
        

        if (this.styles.showWireframe){
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1*this.unit;
            ctx.strokeRect(...pos.border.arr);
        }
    
        const text = toHex(value).padStart(2,'0');
        ctx.font = this.styles.byte.font;
        ctx.fillStyle = byteIndex % 2 == 0 ?
            this.styles.byteEven.color :
            this.styles.byteOdd.color
        ;
    
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text, ...pos.inner.center.arr);

        if (
            (
                this.state.currentHover.type == "byte"
                || this.state.currentHover.type == "char"
            )
            && this.state.currentHover.pos.x == byteIndex
            && this.state.currentHover.pos.y == renderIndex
        ){
            this.drawHover(pos.border);
        }
    }
    drawChar(props: { renderIndex: number, byteIndex: number, value: number | undefined }): void {
        const ctx = this.ctx;
    
        const { value, renderIndex, byteIndex } = props;
    
        if (value == undefined){
            return;
        }

        const pos = this.layout.charBox.get(renderIndex,byteIndex);

        const index = this.renderPosToFileIndex(renderIndex,byteIndex);

        if (isSelectedIndex(index,this.state.pendingSelectionRanges)){
            this.drawSelection(pos.border);
        }

        if (this.state.cursorPosition == index){
            this.drawCursor(pos.border);
        }
    
        if (this.styles.showWireframe){
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1*this.unit;
            ctx.strokeRect(...pos.border.arr);
        }
    
        const printable = byteToPrintable(value);
        const text = printable.text;
        ctx.font = this.styles.char.font;
    
        ctx.fillStyle = this.styles.charType[printable.type].color || this.styles.charType["other"].color;
    
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text, ...pos.inner.center.arr);

        if (
            (
                this.state.currentHover.type == "byte"
                || this.state.currentHover.type == "char"
            )
            && this.state.currentHover.pos.x == byteIndex
            && this.state.currentHover.pos.y == renderIndex
        ){
            this.drawHover(pos.border);
        }
    }
}