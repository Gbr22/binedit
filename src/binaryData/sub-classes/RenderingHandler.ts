import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
import { bytesPerRow, rowHeight } from "../constants";
import { getRowIndex, toHex, type Row, byteToPrintable, type Printable } from "../row";
import styles from "../styles.module.scss";

const fontSize = 14;
const byteWith = 23;
const charWidth = 11;
const showWireFrame = false;

export function ImplRenderingHandler<T extends Constructor<Base>>(constructor: T = Base as any) {
    const cls = class extends constructor {

        rows = new Set<Row>()

        getRenderIndex(startByte: number): number {
            const that = this as any as EditorThis;

            const index = getRowIndex(startByte);
            const renderIndex = index - that.intermediateState.value.topRow;
            return renderIndex;
        }

        isRenderIndexInViewport(index: number): boolean {
            const that = this as any as EditorThis;
            
            return index >= 0 && index < that.viewportRowCount.value;
        }

        render(){
            const that = this as any as EditorThis;

            that.element.dataset["scrollType"] = `${that.scrollBarType.value}`;
            if (that.scrollBarType.value == "virtual"){
                that.element.scrollTop = 0;
            }
            that.scrollView.style.setProperty('--row-count',that.scrollRowCount.value.toString());
            
            this.draw();

            that.renderedState.value = that.intermediateState.value;
        }

        draw(){
            const that = this as any as EditorThis;
            const ctx = that.ctx;
            const canvas = that.canvas;
            const scale = window.devicePixelRatio;

            that.canvas.width = that.intermediateState.value.width;
            that.canvas.height = that.intermediateState.value.height;
            that.canvas.style.setProperty("--device-pixel-ratio",window.devicePixelRatio.toString())

            ctx.fillStyle = "#1F1F1F"
            ctx.fillRect(0,0,canvas.width,canvas.height);

            {
                ctx.fillStyle = "#1a1a1a";
                const rect = this.getCountRect(0);
                ctx.fillRect(
                    rect.x * scale,
                    0,
                    rect.width * scale,
                    canvas.height
                )
            }

            for(let renderIndex = 0; renderIndex < that.viewportRowCount.value; renderIndex++){
                this.drawRow(renderIndex);
            }
        }
        drawRow(renderIndex: number){
            const that = this as any as EditorThis;
            const ctx = that.ctx;
            const canvas = that.canvas;

            const fileIndex = that.intermediateState.value.topRow + renderIndex;
            const startByte = fileIndex * bytesPerRow;

            this.drawCount(renderIndex);

            for(let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++){
                const value = that.getByte(renderIndex * bytesPerRow + byteIndex);
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
        getRowPosition(y: number){
            return y * rowHeight;
        }
        getCountRect(y: number){
            return {
                x: 0,
                y: this.getRowPosition(y),
                width: 80,
                height: rowHeight
            }
        }
        getByteRect(y: number,x: number){
            const top = this.getRowPosition(y);
            const count = this.getCountRect(y);
            return {
                x: x * byteWith + count.x + count.width,
                y: top,
                width: byteWith,
                height: rowHeight,
            }
        }
        getCharRect(y: number,x: number){
            const top = this.getRowPosition(y);
            const pos = this.getByteRect(y,16);

            return {
                x: pos.x + (x * charWidth),
                y: top,
                width: charWidth,
                height: rowHeight
            }
        }
        drawCount(renderIndex: number){
            const that = this as any as EditorThis;
            const ctx = that.ctx;
            const canvas = that.canvas;
            const scale = window.devicePixelRatio;

            const count = renderIndex + that.intermediateState.value.topRow;

            const text = toHex(count).padStart(8,'0');
            ctx.font = `${fontSize * scale}px monospace`;
            const size = ctx.measureText(text);
            
            const pos = this.getCountRect(renderIndex);

            if (showWireFrame){
                ctx.strokeStyle = "green";
                ctx.lineWidth = 1*scale;
                ctx.strokeRect(pos.x*scale,pos.y*scale,pos.width*scale,pos.height*scale);
            }

            ctx.fillStyle = "#c8c8c8";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text,
                ( pos.x + pos.width/2 ) * scale,
                ( pos.y + pos.height/2 ) * scale,
            );
        }
        drawByte(props: { renderIndex: number, byteIndex: number, value: number | undefined }){
            const that = this as any as EditorThis;
            const ctx = that.ctx;
            const canvas = that.canvas;
            const scale = window.devicePixelRatio;

            const { value, renderIndex, byteIndex } = props;

            if (value == undefined){
                return;
            }

            const pos = this.getByteRect(renderIndex,byteIndex);

            if (showWireFrame){
                ctx.strokeStyle = "red";
                ctx.lineWidth = 1*scale;
                ctx.strokeRect(pos.x*scale,pos.y*scale,pos.width*scale,pos.height*scale);
            }

            const text = toHex(value).padStart(2,'0');
            ctx.font = `${fontSize * scale}px monospace`;
            const size = ctx.measureText(text);
            ctx.fillStyle = byteIndex % 2 == 0 ? "#c8c8c8" : "#a3a3a3";

            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text,
                ( pos.x + pos.width/2 ) * scale,
                ( pos.y + pos.height/2 ) * scale,
            );
        }
        drawChar(props: { renderIndex: number, byteIndex: number, value: number | undefined }){
            const that = this as any as EditorThis;
            const ctx = that.ctx;
            const canvas = that.canvas;
            const scale = window.devicePixelRatio;

            const { value, renderIndex, byteIndex } = props;

            if (value == undefined){
                return;
            }

            const pos = this.getCharRect(renderIndex,byteIndex);

            if (showWireFrame){
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 1*scale;
                ctx.strokeRect(pos.x*scale,pos.y*scale,pos.width*scale,pos.height*scale);
            }

            const printable = byteToPrintable(value);
            const text = printable.text;
            ctx.font = `${fontSize * scale}px monospace`;
            const size = ctx.measureText(text);

            let color = "#565656";

            if (printable.type == "ascii"){
                color = "#5ac6f0"
            } else if (printable.type == "control"){
                color = "#CE834A";
            }

            ctx.fillStyle = color;

            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(text,
                ( pos.x + pos.width/2 ) * scale,
                ( pos.y + pos.height/2 ) * scale,
            );
        }
    };

    return chainImpl(cls);
}