import { getCssBoolean, getCssNumber, getCssString } from "@/theme";
import type { Layout } from "./layout";
import type { State } from "./state";
import type { Styles } from "./styles";
import type { Editor } from "@/binaryData/editor";
import { Box } from "./box";
import { byteToPrintable, toHex } from "@/binaryData/row";

interface RendererDependecies {
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
    editor: Editor
    styles: Styles
    layout: Layout
    state: State
}

export class Renderer {
    layout: Layout;
    styles: Styles;
    state: State;

    get unit() { return this.layout.unit }
    get boxCaches() { return this.layout.boxCaches }
    get bytesPerRow() { return this.layout.bytesPerRow }
    get viewportRowCount() { return this.layout.viewportRowCount }
    get positionInFile() { return this.state.positionInFile }
    get rowHeight() { return this.layout.rowHeight }

    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    editor: Editor;

    constructor(deps: RendererDependecies) {
        this.styles = deps.styles;
        this.layout = deps.layout;
        this.state = deps.state;
        this.canvas = deps.canvas;
        this.ctx = deps.ctx;
        this.width = deps.layout.width;
        this.height = deps.layout.height;
        this.editor = deps.editor;
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
    
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.setProperty("--device-pixel-ratio",window.devicePixelRatio.toString())
    
        ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-background-color");
        ctx.fillRect(0,0,canvas.width,canvas.height);
    
        {
            const box = this.layout.getByteCountContainer();
            ctx.strokeStyle = getCssString(this.editor.dom.innerContainer,"--editor-border-color");
            ctx.strokeRect(...box.border.arr);
            ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-row-number-background-color");
            ctx.fillRect(...box.border.arr);
        }
        {
            const box = this.layout.getCharsContainer();
            ctx.strokeStyle = getCssString(this.editor.dom.innerContainer,"--editor-border-color");
            ctx.strokeRect(...box.border.arr);
            ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-background-color");
            ctx.fillRect(...box.border.arr);
        }
    
        for(let renderIndex = 0; renderIndex < this.editor.size.viewportRowCount; renderIndex++){
            this.drawRow(renderIndex);
        }
    }
    drawRow(renderIndex: number): void {
        this.drawByteCount(renderIndex);
    
        for(let byteIndex = 0; byteIndex < this.bytesPerRow; byteIndex++){
            const value = this.editor.data.getRenderByte(renderIndex * this.bytesPerRow + byteIndex);
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
        return renderIndex * this.bytesPerRow + this.editor.update.intermediateState.value.positionInFile;
    }
    drawHover(box: Box){
        const ctx = this.ctx;
        ctx.strokeStyle = getCssString(this.editor.dom.innerContainer,"--editor-select-border-color");
        ctx.lineWidth = 1*this.unit;
        ctx.strokeRect(...box.arr);
    }
    drawCursor(box: Box){
        const ctx = this.ctx;
        ctx.strokeStyle = getCssString(this.editor.dom.innerContainer,"--editor-cursor-border-color");
        ctx.lineWidth = 1*this.unit;
        ctx.strokeRect(...box.arr);
    }
    drawSelection(box: Box){
        const ctx = this.ctx;
        ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-cursor-background-color");
        ctx.fillRect(...box.arr);
    }
    drawByteCount(renderIndex: number): void {
        const ctx = this.ctx;
    
        const count = this.getByteCountOfRow(renderIndex);
    
        const text = this.layout.getPaddedByteCount(count);
        ctx.font = this.styles.getByteCountFont();
        
        const pos = this.layout.getByteCountBox(renderIndex);
    
        if (getCssBoolean(this.editor.dom.element,"--editor-show-wireframe")){
            ctx.strokeStyle = "green";
            ctx.lineWidth = 1*this.unit;
            ctx.strokeRect(...pos.inner.arr);
        }
    
        ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-row-number-foreground-color");
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text,...pos.inner.center.arr);

        if (
            this.editor.gesture.mouse.currentHover.type == "byte-count"
            && this.editor.gesture.mouse.currentHover.y == renderIndex
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
    
        const pos = this.layout.getByteBox(renderIndex,byteIndex);
        const index = this.renderPosToFileIndex(renderIndex,byteIndex);
    
        if (this.editor.selection.isSelectedIndex(index)){
            this.drawSelection(pos.border);
        }

        if (this.editor.selection.cursorPosition == index){
            this.drawCursor(pos.border);
        }
        

        if (getCssBoolean(this.editor.dom.element,"--editor-show-wireframe")){
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1*this.unit;
            ctx.strokeRect(...pos.border.arr);
        }
    
        const text = toHex(value).padStart(2,'0');
        ctx.font = `${getCssNumber(this.editor.dom.innerContainer,"--editor-font-size") * this.unit}px ${getCssString(this.editor.dom.innerContainer,"--editor-font-family")}`;
        ctx.fillStyle = byteIndex % 2 == 0 ?
            getCssString(this.editor.dom.innerContainer,"--editor-byte-1-foreground-color") :
            getCssString(this.editor.dom.innerContainer,"--editor-byte-2-foreground-color")
        ;
    
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text, ...pos.inner.center.arr);

        if (
            (
                this.editor.gesture.mouse.currentHover.type == "byte"
                || this.editor.gesture.mouse.currentHover.type == "char"
            )
            && this.editor.gesture.mouse.currentHover.pos.x == byteIndex
            && this.editor.gesture.mouse.currentHover.pos.y == renderIndex
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

        const pos = this.layout.getCharBox(renderIndex,byteIndex);

        const index = this.renderPosToFileIndex(renderIndex,byteIndex);

        if (this.editor.selection.isSelectedIndex(index)){
            this.drawSelection(pos.border);
        }

        if (this.editor.selection.cursorPosition == index){
            this.drawCursor(pos.border);
        }
    
        if (getCssBoolean(this.editor.dom.element,"--editor-show-wireframe")){
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1*this.unit;
            ctx.strokeRect(...pos.border.arr);
        }
    
        const printable = byteToPrintable(value);
        const text = printable.text;
        ctx.font = `${getCssNumber(this.editor.dom.innerContainer,"--editor-font-size") * this.unit}px ${getCssString(this.editor.dom.innerContainer,"--editor-font-family")}`;
    
        ctx.fillStyle = getCssString(this.editor.dom.innerContainer,`--editor-char-${printable.type}-color`);
    
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text, ...pos.inner.center.arr);

        if (
            (
                this.editor.gesture.mouse.currentHover.type == "byte"
                || this.editor.gesture.mouse.currentHover.type == "char"
            )
            && this.editor.gesture.mouse.currentHover.pos.x == byteIndex
            && this.editor.gesture.mouse.currentHover.pos.y == renderIndex
        ){
            this.drawHover(pos.border);
        }
    }
}