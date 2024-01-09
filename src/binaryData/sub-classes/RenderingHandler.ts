import { Editor } from "../editor";
import { bytesPerRow, rowHeight } from "../constants";
import { getRowIndex, toHex, type Row, byteToPrintable, type Printable } from "../row";
import styles from "../styles.module.scss";
import { emptyCssCache, getCssBoolean, getCssNumber, getCssString } from "@/theme";

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface IRenderingHandler {
    rows: Set<Row>

    initRenderingHandler: ()=>void
    getRenderIndex: (startByte: number)=>number
    isRenderIndexInViewport: (index: number)=>boolean
    render: ()=>void
    draw: ()=>void
    drawRow: (renderIndex: number)=>void
    getRowPosition: (y: number)=>number
    getCountRect: (y: number)=>Rect
    getByteRect: (y: number,x: number)=>Rect
    getCharRect: (y: number,x: number)=>Rect
    drawCount: (renderIndex: number)=>void
    drawByte: (props: { renderIndex: number, byteIndex: number, value: number | undefined })=>void
    drawChar: (props: { renderIndex: number, byteIndex: number, value: number | undefined })=>void
}

export function patchRenderingHandler(){
    Editor.prototype.initRenderingHandler = function(){
        this.rows = new Set<Row>();
    }
    Editor.prototype.getRenderIndex = function(startByte: number): number {
        const index = getRowIndex(startByte);
        const renderIndex = index - this.intermediateState.value.topRow;
        return renderIndex;
    }
    Editor.prototype.isRenderIndexInViewport = function(index: number): boolean {
        return index >= 0 && index < this.viewportRowCount.value;
    }
    Editor.prototype.render = function(){
        emptyCssCache();
        this.element.dataset["scrollType"] = `${this.scrollBarType.value}`;
        if (this.scrollBarType.value == "virtual"){
            this.element.scrollTop = 0;
        }
        this.scrollView.style.setProperty('--row-count',this.scrollRowCount.value.toString());
        
        this.draw();
    
        this.renderedState.value = this.intermediateState.value;
    }
    
    Editor.prototype.draw = function(){
        const ctx = this.ctx;
        const canvas = this.canvas;
        const scale = window.devicePixelRatio;
    
        this.canvas.width = this.intermediateState.value.width;
        this.canvas.height = this.intermediateState.value.height;
        this.canvas.style.setProperty("--device-pixel-ratio",window.devicePixelRatio.toString())
    
        ctx.fillStyle = getCssString("--editor-background-color");
        ctx.fillRect(0,0,canvas.width,canvas.height);
    
        {
            const rect = this.getCountRect(0);
            const r: [number, number, number, number] = [
                rect.x * scale,
                0,
                rect.width * scale,
                canvas.height
            ]
            ctx.strokeStyle = getCssString("--editor-border-color");
            ctx.strokeRect(...r);
            ctx.fillStyle = getCssString("--editor-row-number-background-color");
            ctx.fillRect(...r);
        }
    
        for(let renderIndex = 0; renderIndex < this.viewportRowCount.value; renderIndex++){
            this.drawRow(renderIndex);
        }
    }
    
    Editor.prototype.drawRow = function(renderIndex: number){
        const ctx = this.ctx;
        const canvas = this.canvas;
    
        const fileIndex = this.intermediateState.value.topRow + renderIndex;
        const startByte = fileIndex * bytesPerRow;
    
        this.drawCount(renderIndex);
    
        for(let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++){
            const value = this.getByte(renderIndex * bytesPerRow + byteIndex);
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
    Editor.prototype.getRowPosition = function(y: number){
        return y * rowHeight;
    }
    Editor.prototype.getCountRect = function(y: number): Rect {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const scale = window.devicePixelRatio;
    
        const count = this.intermediateState.value.topRow + this.viewportRowCount.value;
        const text = toHex(count).padStart(getCssNumber("--editor-row-number-digit-count"),'0');
    
        ctx.font = `${getCssNumber("--editor-font-size") * scale}px ${getCssString("--editor-font-family")}`;
        const size = ctx.measureText(text);
    
        return {
            x: 0,
            y: this.getRowPosition(y),
            width: size.width,
            height: rowHeight
        }
    }
    
    Editor.prototype.getByteRect = function(y: number,x: number): Rect {
        const top = this.getRowPosition(y);
        const count = this.getCountRect(y);
        return {
            x: x * getCssNumber("--editor-byte-width") + count.x + count.width,
            y: top,
            width: getCssNumber("--editor-byte-width"),
            height: rowHeight,
        }
    }
    Editor.prototype.getCharRect = function(y: number,x: number): Rect {
        const top = this.getRowPosition(y);
        const pos = this.getByteRect(y,16);
    
        return {
            x: pos.x + (x * getCssNumber("--editor-char-width")),
            y: top,
            width: getCssNumber("--editor-char-width"),
            height: rowHeight
        }
    }
    Editor.prototype.drawCount = function(renderIndex: number){
        const ctx = this.ctx;
        const canvas = this.canvas;
        const scale = window.devicePixelRatio;
    
        const count = renderIndex + this.intermediateState.value.topRow;
    
        const text = toHex(count).padStart(getCssNumber("--editor-row-number-digit-count"),'0');
        ctx.font = `${getCssNumber("--editor-font-size") * scale}px ${getCssString("--editor-font-family")}`;
        const size = ctx.measureText(text);
        
        const pos = this.getCountRect(renderIndex);
    
        if (getCssBoolean("--editor-show-wireframe")){
            ctx.strokeStyle = "green";
            ctx.lineWidth = 1*scale;
            ctx.strokeRect(pos.x*scale,pos.y*scale,pos.width*scale,pos.height*scale);
        }
    
        ctx.fillStyle = getCssString("--editor-row-number-foreground-color");
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text,
            ( pos.x + pos.width/2 ) * scale,
            ( pos.y + pos.height/2 ) * scale,
        );
    }
    
    Editor.prototype.drawByte = function(props: { renderIndex: number, byteIndex: number, value: number | undefined }){
        const ctx = this.ctx;
        const canvas = this.canvas;
        const scale = window.devicePixelRatio;
    
        const { value, renderIndex, byteIndex } = props;
    
        if (value == undefined){
            return;
        }
    
        const pos = this.getByteRect(renderIndex,byteIndex);
    
        if (getCssBoolean("--editor-show-wireframe")){
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1*scale;
            ctx.strokeRect(pos.x*scale,pos.y*scale,pos.width*scale,pos.height*scale);
        }
    
        const text = toHex(value).padStart(2,'0');
        ctx.font = `${getCssNumber("--editor-font-size") * scale}px ${getCssString("--editor-font-family")}`;
        const size = ctx.measureText(text);
        ctx.fillStyle = byteIndex % 2 == 0 ?
            getCssString("--editor-byte-1-foreground-color") :
            getCssString("--editor-byte-2-foreground-color")
        ;
    
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text,
            ( pos.x + pos.width/2 ) * scale,
            ( pos.y + pos.height/2 ) * scale,
        );
    }
    Editor.prototype.drawChar = function(props: { renderIndex: number, byteIndex: number, value: number | undefined }){
        const ctx = this.ctx;
        const canvas = this.canvas;
        const scale = window.devicePixelRatio;
    
        const { value, renderIndex, byteIndex } = props;
    
        if (value == undefined){
            return;
        }
    
        const pos = this.getCharRect(renderIndex,byteIndex);
    
        if (getCssBoolean("--editor-show-wireframe")){
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 1*scale;
            ctx.strokeRect(pos.x*scale,pos.y*scale,pos.width*scale,pos.height*scale);
        }
    
        const printable = byteToPrintable(value);
        const text = printable.text;
        ctx.font = `${getCssNumber("--editor-font-size") * scale}px ${getCssString("--editor-font-family")}`;
        const size = ctx.measureText(text);
    
        ctx.fillStyle = getCssString(`--editor-char-${printable.type}-color`);
    
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text,
            ( pos.x + pos.width/2 ) * scale,
            ( pos.y + pos.height/2 ) * scale,
        );
    }
}
