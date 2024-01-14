import { Editor } from "../editor";
import { TrackedVar } from "../reactivity";
import { defineSubsystem } from "../composition";
import type { Point, Rect } from "./RenderingHandler";
import { bytesPerRow } from "../constants";

export function isCollision(rect: Rect, point: Point): boolean {
    return (
        point.x >= rect.x &&
        point.x <= (rect.x + rect.width) &&
        point.y >= rect.y &&
        point.y <= (rect.y + rect.height)
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
            const lastHover = this.currentHover;
            const newHover = this.getCurrentHover();
            this.currentHover = newHover;
            if (JSON.stringify(lastHover) != JSON.stringify(newHover)){
                this.draw();
            }
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
            const x = pos.x * this.getScale();
            const y = pos.y * this.getScale();
            return {
                x,y
            }
        },
        getCurrentHover(this: Editor): Hover {
            const pos = this.getScaledCanvasMousePosition();
            for (let y = 0; y < this.viewportRowCount.value; y++){
                const renderIndex = y;
                const byteCountRect = this.getByteCountRect(renderIndex);
                if (isCollision(byteCountRect,pos)){
                    return {
                        type: "byte-count",
                        y
                    }
                }
                for (let x = 0; x < bytesPerRow; x++){
                    const byteRect = this.getByteRect(renderIndex,x);
                    if (isCollision(byteRect,pos)){
                        return {
                            type: "byte",
                            pos: {
                                y,
                                x
                            }
                        }
                    }
                    const charRect = this.getCharRect(renderIndex,x);
                    if (isCollision(charRect,pos)){
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
