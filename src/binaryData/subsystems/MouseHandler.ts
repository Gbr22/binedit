import { Editor } from "../editor";
import { defineSubsystem } from "../composition";
import { Box } from "./RenderingHandler";
import { bytesPerRow } from "../constants";

export interface Point {
    x: number
    y: number
}

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

        const onMouseMove = (e: MouseEvent)=>{
            mousePosition.x = e.clientX;
            mousePosition.y = e.clientY;
            this.checkHover();
        }

        window.addEventListener("mousemove",onMouseMove, {passive: true});

        const canvas = this.canvas;

        canvas.onmousedown = (e)=>{
            if (e.button != 0){
                return;
            }
            const hover = this.currentHover;
            if (hover.type == "byte" || hover.type == "char"){
                const index = this.pointToFileIndex(hover.pos);
                this.selection.startRange("mouse",index,e.ctrlKey);
                this.selection.setCursor(index);
                this.redraw();
            }
        }
        canvas.addEventListener("mouseleave",(e: MouseEvent)=>{
            this.selection.cancelRange();
            this.redraw();
        },{passive: true})

        const onMouseUp = (e: MouseEvent)=>{
            if (e.button != 0){
                return;
            }
            this.selection.endRange();
            this.redraw();
        };

        window.addEventListener("mouseup",onMouseUp,{passive: true});

        const onDispose = this.onDispose.bind(this);
        onDispose(()=>{
            window.removeEventListener("mouseup",onMouseUp);
            window.removeEventListener("mousemove",onMouseMove);
        });

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
                this.selection.hoverOverByte("mouse",this.pointToFileIndex(hover.pos));
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
            for (let y = 0; y < this.size.viewportRowCount; y++){
                const renderIndex = y;
                const byteCountRect = this.getByteCountBox(renderIndex);
                if (isCollision(byteCountRect.border,pos)){
                    return {
                        type: "byte-count",
                        y
                    }
                }
                for (let x = 0; x < bytesPerRow; x++){
                    const byteRect = this.getByteBox(renderIndex,x);
                    if (isCollision(byteRect.border,pos)){
                        return {
                            type: "byte",
                            pos: {
                                y,
                                x
                            }
                        }
                    }
                    const charRect = this.getCharBox(renderIndex,x);
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
