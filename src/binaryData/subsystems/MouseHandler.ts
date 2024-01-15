import { Editor } from "../editor";
import { defineSubsystem } from "../composition";
import { Box, type Point } from "./RenderingHandler";
import { bytesPerRow } from "../constants";

export function isCollision(box: Box, point: Point): boolean {
    return (
        point.x >= box.left &&
        point.x <= box.right &&
        point.y >= box.top &&
        point.y <= box.bottom
    );
}

type ByteHover = {
    type: "byte",
    pos: Point
}
type ByteCountHover = {
    type: "byte-count",
    y: number
}
type CharHover = {
    type: "char"
    pos: Point
}
type NoneHover = {
    type: "none"
}
export type Hover = { type: string } & (
    NoneHover | ByteHover | ByteCountHover | CharHover
);

export const MouseHandler = defineSubsystem({
    name: "MouseHandler",
    init(this: Editor) {
        const mousePosition: Point = {
            x: 0,
            y: 0,
        }
        let currentHover: Hover = {
            type: "none"
        }

        this.element.onmouseenter = this.element.onmouseleave = this.element.onmousemove = (e)=>{
            mousePosition.x = e.clientX;
            mousePosition.y = e.clientY;
            this.checkHover();
        }

        this.element.onclick = (e)=>{
            const hover = this.currentHover;
            if (hover.type == "byte" || hover.type == "char"){
                this.onClickByte(this.pointToFileIndex(hover.pos),e);
            }
        }
        this.element.onmousedown = (e)=>{
            const hover = this.currentHover;
            if (hover.type == "byte" || hover.type == "char"){
                this.onMouseDownByte(this.pointToFileIndex(hover.pos),e);
            }
        }
        this.element.onmouseup = (e)=>{
            const hover = this.currentHover;
            if (hover.type == "byte" || hover.type == "char"){
                this.onMouseUpByte(this.pointToFileIndex(hover.pos),e);
            }
        }

        return {
            mousePosition,
            currentHover: currentHover as Hover
        }
    },
    proto: {
        checkHover(this: Editor){
            const lastHover = this.currentHover;
            const newHover = this.getCurrentHover();
            if (JSON.stringify(lastHover) != JSON.stringify(newHover)){
                this.setHover(newHover);
                this.redraw();
            }
        },
        setHover(this: Editor, hover: Hover){
            this.currentHover = hover;
            if (hover.type == "byte" || hover.type == "char"){
                this.onHoverByte(this.pointToFileIndex(hover.pos));
            }
        },
        forceUpdateHover(this: Editor){
            const hover = this.getCurrentHover();
            this.setHover(hover);
        },
        getCanvasMousePosition(this: Editor){
            const rect = this.canvas.getBoundingClientRect();
            const y = this.mousePosition.y - rect.top;
            const x = this.mousePosition.x - rect.left;
            return {
                x,y
            }
        },
        getScaledCanvasMousePosition(this: Editor){
            const pos = this.getCanvasMousePosition();
            const x = pos.x * this.unit;
            const y = pos.y * this.unit;
            return {
                x,y
            }
        },
        getCurrentHover(this: Editor): Hover {
            const pos = this.getScaledCanvasMousePosition();
            for (let y = 0; y < this.viewportRowCount.value; y++){
                const renderIndex = y;
                const byteCountRect = this.getByteCountBox(renderIndex);
                if (isCollision(byteCountRect.border,pos)){
                    return {
                        type: "byte-count",
                        y
                    }
                }
                for (let x = 0; x < bytesPerRow; x++){
                    const byteRect = this.getByteRect(renderIndex,x);
                    if (isCollision(byteRect.border,pos)){
                        return {
                            type: "byte",
                            pos: {
                                y,
                                x
                            }
                        }
                    }
                    const charRect = this.getCharRect(renderIndex,x);
                    if (isCollision(charRect.border,pos)){
                        return {
                            type: "char",
                            pos: {
                                y,
                                x
                            }
                        }
                    }
                }
            }
            return {
                type: "none"
            }
        }
    },
});
