import { Editor } from "../editor";
import { bytesPerRow, rowHeight } from "../constants";
import { getRowIndex, toHex, type Row, byteToPrintable, type Printable } from "../row";
import styles from "../styles.module.scss";
import { emptyCssCache, getCssBoolean, getCssNumber, getCssString } from "@/theme";
import { defineSubsystem } from "../composition";

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export const RenderingHandler = defineSubsystem({
    name: "RenderingHandler",
    init(this: Editor) {
        return {
            rows: new Set<Row>()
        };
    },
    proto: {
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
            this.element.dataset["scrollType"] = `${this.scrollBarType.value}`;
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
        
            ctx.fillStyle = getCssString("--editor-background-color");
            ctx.fillRect(0,0,canvas.width,canvas.height);
        
            {
                const rect = this.getByteCountRect(0);
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
        },
        drawRow(this: Editor, renderIndex: number): void {
            const ctx = this.ctx;
            const canvas = this.canvas;
        
            const fileIndex = this.intermediateState.value.topRow + renderIndex;
            const startByte = fileIndex * bytesPerRow;
        
            this.drawByteCount(renderIndex);
        
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
        },
        getRowPosition(this: Editor, y: number){
            return y * rowHeight;
        },
        /**
         * @returns The **unscaled** dimensions of the byte counter.
         */
        getByteCountRect(this: Editor, y: number): Rect {
            const ctx = this.ctx;
            const scale = window.devicePixelRatio;
        
            const count = this.getByteCountOfRow(0);
            ctx.font = this.getByteCountFont();
            const text = this.getPaddedByteCount(count);
            const size = ctx.measureText(text);
            const textWidth = size.width / scale;
            const padding = 10;
        
            return {
                x: 0,
                y: this.getRowPosition(y),
                width: textWidth + padding,
                height: rowHeight
            }
        },
        getByteRect(this: Editor, y: number,x: number): Rect {
            const top = this.getRowPosition(y);
            const count = this.getByteCountRect(y);
            return {
                x: x * getCssNumber("--editor-byte-width") + count.x + count.width,
                y: top,
                width: getCssNumber("--editor-byte-width"),
                height: rowHeight,
            }
        },
        getCharRect(this: Editor, y: number,x: number): Rect {
            const top = this.getRowPosition(y);
            const pos = this.getByteRect(y,16);
        
            return {
                x: pos.x + (x * getCssNumber("--editor-char-width")),
                y: top,
                width: getCssNumber("--editor-char-width"),
                height: rowHeight
            }
        },
        getByteCountOfRow(this: Editor, renderIndex: number){
            return renderIndex + this.intermediateState.value.topRow;
        },
        getPaddedByteCount(count: number){
            return toHex(count).padStart(getCssNumber("--editor-row-number-digit-count"),'0');
        },
        /**
         * @returns the **scaled** font for the byte count text 
         */
        getByteCountFont(this: Editor) {
            const scale = window.devicePixelRatio;
            return `${getCssNumber("--editor-font-size") * scale}px ${getCssString("--editor-font-family")}`
        },
        drawByteCount(this: Editor, renderIndex: number): void {
            const ctx = this.ctx;
            const scale = window.devicePixelRatio;
        
            const count = this.getByteCountOfRow(renderIndex);
        
            const text = this.getPaddedByteCount(count);
            ctx.font = this.getByteCountFont();
            
            const pos = this.getByteCountRect(renderIndex);
        
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
        },
        drawByte(this: Editor, props: { renderIndex: number, byteIndex: number, value: number | undefined }): void {
            const ctx = this.ctx;
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
        },
        drawChar(this: Editor, props: { renderIndex: number, byteIndex: number, value: number | undefined }): void {
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
});
