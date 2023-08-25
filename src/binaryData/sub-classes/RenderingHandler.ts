import type { EditorThis } from "../editor";
import { Base, type Constructor, chainImpl } from "../composition";
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
            emptyCssCache();
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
        getCountRect(y: number): Rect {
            const that = this as any as EditorThis;
            const ctx = that.ctx;
            const canvas = that.canvas;
            const scale = window.devicePixelRatio;

            const count = that.intermediateState.value.topRow + that.viewportRowCount.value;
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
        getByteRect(y: number,x: number){
            const top = this.getRowPosition(y);
            const count = this.getCountRect(y);
            return {
                x: x * getCssNumber("--editor-byte-width") + count.x + count.width,
                y: top,
                width: getCssNumber("--editor-byte-width"),
                height: rowHeight,
            }
        }
        getCharRect(y: number,x: number){
            const top = this.getRowPosition(y);
            const pos = this.getByteRect(y,16);

            return {
                x: pos.x + (x * getCssNumber("--editor-char-width")),
                y: top,
                width: getCssNumber("--editor-char-width"),
                height: rowHeight
            }
        }
        drawCount(renderIndex: number){
            const that = this as any as EditorThis;
            const ctx = that.ctx;
            const canvas = that.canvas;
            const scale = window.devicePixelRatio;

            const count = renderIndex + that.intermediateState.value.topRow;

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
    };

    return chainImpl(cls);
}