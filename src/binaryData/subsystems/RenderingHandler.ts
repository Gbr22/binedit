import { Editor } from "../editor";
import { bytesPerRow, rowHeight } from "../constants";
import { getRowIndex, toHex, type Row, byteToPrintable } from "../row";
import { emptyCssCache, getCssBoolean, getCssNumber, getCssString } from "@/theme";
import { defineSubsystem } from "../composition";
import { isCollision } from "./MouseHandler";

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface Point {
    x: number
    y: number
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
            const scale = window.devicePixelRatio;
        
            this.canvas.width = this.intermediateState.value.width;
            this.canvas.height = this.intermediateState.value.height;
            this.canvas.style.setProperty("--device-pixel-ratio",window.devicePixelRatio.toString())
        
            ctx.fillStyle = getCssString(this.innerContainer,"--editor-background-color");
            ctx.fillRect(0,0,canvas.width,canvas.height);
        
            {
                const rect = this.getByteCountRect(0);
                const r: [number, number, number, number] = [
                    rect.x,
                    0,
                    rect.width,
                    canvas.height
                ]
                ctx.strokeStyle = getCssString(this.innerContainer,"--editor-border-color");
                ctx.strokeRect(...r);
                ctx.fillStyle = getCssString(this.innerContainer,"--editor-row-number-background-color");
                ctx.fillRect(...r);
            }
            {
                const rectStart = this.getCharRect(0,0);
                const rectEnd = this.getCharRect(0,this.bytesPerRow-1);
                const r: [number, number, number, number] = [
                    rectStart.x,
                    -10,
                    (rectEnd.x + rectEnd.width) - rectStart.x,
                    canvas.height + 20
                ]
                ctx.strokeStyle = getCssString(this.innerContainer,"--editor-border-color");
                ctx.strokeRect(...r);
            }
        
            for(let renderIndex = 0; renderIndex < this.viewportRowCount.value; renderIndex++){
                this.drawRow(renderIndex);
            }
        },
        drawRow(this: Editor, renderIndex: number): void {
            const ctx = this.ctx;
            const canvas = this.canvas;
        
            const fileIndex = this.intermediateState.value.topRow + renderIndex;
            const startByte = fileIndex * bytesPerRow;
        
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
        getByteCountRect(this: Editor, y: number): Rect {
            const ctx = this.ctx;
        
            const count = this.getByteCountOfRow(0);
            ctx.font = this.getByteCountFont();
            const text = this.getPaddedByteCount(count);
            const size = ctx.measureText(text);
            const textWidth = size.width;
            const padding = 10;
        
            return {
                x: 0,
                y: this.getRowPosition(y) * this.getScale(),
                width: textWidth + padding * this.getScale(),
                height: rowHeight * this.getScale()
            }
        },
        getByteRect(this: Editor, y: number,x: number): Rect {
            const top = this.getRowPosition(y);
            const count = this.getByteCountRect(y);
            return {
                x: x * getCssNumber(this.innerContainer,"--editor-byte-width") * this.getScale() + count.x + count.width,
                y: top * this.getScale(),
                width: getCssNumber(this.innerContainer,"--editor-byte-width") * this.getScale(),
                height: rowHeight * this.getScale(),
            }
        },
        getCharRect(this: Editor, y: number,x: number): Rect {
            const top = this.getRowPosition(y);
            const pos = this.getByteRect(y,16);
        
            return {
                x: pos.x + (x * getCssNumber(this.innerContainer,"--editor-char-width")) * this.getScale(),
                y: top * this.getScale(),
                width: getCssNumber(this.innerContainer,"--editor-char-width") * this.getScale(),
                height: rowHeight * this.getScale()
            }
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
        drawHover(this: Editor, pos: Rect){
            const ctx = this.ctx;
            ctx.strokeStyle = getCssString(this.innerContainer,"--editor-select-border-color");
            ctx.lineWidth = 1*this.getScale();
            ctx.strokeRect(pos.x,pos.y,pos.width,pos.height);
        },
        drawCursor(this: Editor, pos: Rect){
            const ctx = this.ctx;
            ctx.strokeStyle = getCssString(this.innerContainer,"--editor-cursor-border-color");
            ctx.lineWidth = 1*this.getScale();
            ctx.strokeRect(pos.x,pos.y,pos.width,pos.height);
        },
        drawSelection(this: Editor, pos: Rect){
            const ctx = this.ctx;
            ctx.fillStyle = getCssString(this.innerContainer,"--editor-cursor-background-color");
            ctx.fillRect(pos.x,pos.y,pos.width,pos.height);
        },
        drawByteCount(this: Editor, renderIndex: number): void {
            const ctx = this.ctx;
        
            const count = this.getByteCountOfRow(renderIndex);
        
            const text = this.getPaddedByteCount(count);
            ctx.font = this.getByteCountFont();
            
            const pos = this.getByteCountRect(renderIndex);
        
            if (getCssBoolean(this.element,"--editor-show-wireframe")){
                ctx.strokeStyle = "green";
                ctx.lineWidth = 1*this.getScale();
                ctx.strokeRect(pos.x,pos.y,pos.width,pos.height);
            }
        
            ctx.fillStyle = getCssString(this.innerContainer,"--editor-row-number-foreground-color");
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text,
                ( pos.x + pos.width/2 ),
                ( pos.y + pos.height/2 ),
            );

            if (
                this.currentHover.type == "byte-count"
                && this.currentHover.y == renderIndex
            ){
                this.drawHover(pos);
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
                this.drawSelection(pos);
            }

            if (this.cursorPosition == index){
                this.drawCursor(pos);
            }
            

            if (getCssBoolean(this.element,"--editor-show-wireframe")){
                ctx.strokeStyle = "red";
                ctx.lineWidth = 1*this.getScale();
                ctx.strokeRect(pos.x,pos.y,pos.width,pos.height);
            }
        
            const text = toHex(value).padStart(2,'0');
            ctx.font = `${getCssNumber(this.innerContainer,"--editor-font-size") * this.getScale()}px ${getCssString(this.innerContainer,"--editor-font-family")}`;
            ctx.fillStyle = byteIndex % 2 == 0 ?
                getCssString(this.innerContainer,"--editor-byte-1-foreground-color") :
                getCssString(this.innerContainer,"--editor-byte-2-foreground-color")
            ;
        
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text,
                ( pos.x + pos.width/2 ),
                ( pos.y + pos.height/2 ),
            );

            if (
                (
                    this.currentHover.type == "byte"
                    || this.currentHover.type == "char"
                )
                && this.currentHover.pos.x == byteIndex
                && this.currentHover.pos.y == renderIndex
            ){
                this.drawHover(pos);
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
                this.drawSelection(pos);
            }

            if (this.cursorPosition == index){
                this.drawCursor(pos);
            }
        
            if (getCssBoolean(this.element,"--editor-show-wireframe")){
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 1*this.getScale();
                ctx.strokeRect(pos.x,pos.y,pos.width,pos.height);
            }
        
            const printable = byteToPrintable(value);
            const text = printable.text;
            ctx.font = `${getCssNumber(this.innerContainer,"--editor-font-size") * this.getScale()}px ${getCssString(this.innerContainer,"--editor-font-family")}`;
        
            ctx.fillStyle = getCssString(this.innerContainer,`--editor-char-${printable.type}-color`);
        
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text,
                ( pos.x + pos.width/2 ),
                ( pos.y + pos.height/2 ),
            );


            if (
                (
                    this.currentHover.type == "byte"
                    || this.currentHover.type == "char"
                )
                && this.currentHover.pos.x == byteIndex
                && this.currentHover.pos.y == renderIndex
            ){
                this.drawHover(pos);
            }
        }
    }
});
