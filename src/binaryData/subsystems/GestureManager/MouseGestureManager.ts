import type { GestureManager } from "../GestureManager";
import { bytesPerRow } from "../../constants";
import { dispose, type Disposable } from "@/binaryData/dispose";
import type { Box } from "../RenderingManager/box";

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

export class MouseGestureManager implements Disposable {
    manager: GestureManager;

    get editor(){
        return this.manager.editor;
    }

    position: Point = {
        x: 0,
        y: 0,
    };
    currentHover: Hover = {
        type: "none"
    };

    onMouseMove = (e: MouseEvent)=>{
        this.position.x = e.clientX;
        this.position.y = e.clientY;
        this.checkHover();
    }

    onMouseDown = (e: MouseEvent)=>{
        if (e.button != 0){
            return;
        }
        const hover = this.currentHover;
        if (hover.type == "byte" || hover.type == "char"){
            const index = this.editor.rendering.renderer.pointToFileIndex(hover.pos);
            this.editor.selection.startRange("mouse",index,e.ctrlKey);
            this.editor.selection.setCursor(index);
            this.editor.rendering.redraw();
        }
    }

    onMouseUp = (e: MouseEvent)=>{
        if (e.button != 0){
            return;
        }
        this.editor.selection.endRange();
        this.editor.rendering.redraw();
    }

    registerEventHandlers(){
        window.addEventListener("mousemove",this.onMouseMove, {passive: true});
        window.addEventListener("mouseup",this.onMouseUp,{passive: true});
    }

    unregisterEventHandlers(){
        window.removeEventListener("mousemove",this.onMouseMove);
        window.removeEventListener("mouseup",this.onMouseUp);
    }

    [dispose](){
        this.unregisterEventHandlers();
    }

    constructor(parent: GestureManager){
        this.manager = parent;
        
        const canvas = this.editor.dom.canvas;

        canvas.onmousedown = this.onMouseDown;
        canvas.addEventListener("mouseleave",(e: MouseEvent)=>{
            this.editor.selection.cancelRange();
            this.editor.rendering.redraw();
        },{passive: true})

        this.registerEventHandlers();
    }

    checkHover(){
        const lastHover = this.currentHover;
        const newHover = this.getCurrentHover();
        if (JSON.stringify(lastHover) != JSON.stringify(newHover)){
            this.setHover(newHover);
            this.editor.rendering.redraw();
        }
    }
    setHover(hover: Hover){
        this.currentHover = hover;
        if (hover.type == "byte" || hover.type == "char"){
            this.editor.selection.hoverOverByte("mouse",this.editor.rendering.renderer.pointToFileIndex(hover.pos));
        }
    }
    forceUpdateHover(){
        const hover = this.getCurrentHover();
        this.setHover(hover);
    }
    getCanvasMousePosition(){
        const rect = this.editor.dom.canvas.getBoundingClientRect();
        const y = this.position.y - rect.top;
        const x = this.position.x - rect.left;
        return {
            x,y
        }
    }
    getScaledCanvasMousePosition(){
        const pos = this.getCanvasMousePosition();
        const x = pos.x * this.editor.rendering.unit;
        const y = pos.y * this.editor.rendering.unit;
        return {
            x,y
        }
    }
    getCurrentHover(): Hover {
        const pos = this.getScaledCanvasMousePosition();
        for (let y = 0; y < this.editor.size.viewportRowCount; y++){
            const renderIndex = y;
            const byteCountRect = this.editor.rendering.layout.byteCountBox.get(renderIndex);
            if (isCollision(byteCountRect.border,pos)){
                return {
                    type: "byte-count",
                    y
                }
            }
            for (let x = 0; x < bytesPerRow; x++){
                const byteRect = this.editor.rendering.layout.byteBox.get(renderIndex,x);
                if (isCollision(byteRect.border,pos)){
                    return {
                        type: "byte",
                        pos: {
                            y,
                            x
                        }
                    }
                }
                const charRect = this.editor.rendering.layout.charBox.get(renderIndex,x);
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
}