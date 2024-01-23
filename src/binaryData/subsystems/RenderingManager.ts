import { Editor } from "../editor";
import { bytesPerRow, rowHeight } from "../constants";
import { getRowIndex, toHex, type Row, byteToPrintable } from "../row";
import { emptyCssCache, getCssBoolean, getCssNumber, getCssString } from "@/theme";
import { defineSubsystem } from "../composition";
import { BoundingBox, Box } from "./RenderingManager/box";

type BoxCaches = Map<string,Map<unknown,BoundingBox>>;

export class RenderingManager {
    editor: Editor;

    bytesPerRow: number = 16;
    devicePixelRatio = window.devicePixelRatio;
    scale = 1;
    unit = this.devicePixelRatio * this.scale;
    boxCaches: BoxCaches = new Map();
    rows = new Set<Row>();

    constructor(editor: Editor) {
        this.editor = editor;
    }
    renderPosToFileIndex(y: number, x: number): number {
        return this.pointToFileIndex({x,y});
    }
    pointToFileIndex(pos: {x: number, y: number}): number {
        const index = pos.y * bytesPerRow + pos.x + this.editor.update.intermediateState.value.positionInFile;
        return index;
    }
    isRenderIndexInViewport(index: number): boolean {
        return index >= 0 && index < this.editor.size.viewportRowCount;
    }
    reflow(): void {
        emptyCssCache();
        this.devicePixelRatio = window.devicePixelRatio;
        this.unit = devicePixelRatio * this.scale;
        this.editor.dom.innerContainer.dataset["scrollType"] = `${this.editor.scrollBarType.value}`;
        
        this.editor.dom.scrollView.style.setProperty('--row-count',this.editor.scrollRowCount.value.toString());
        
        const didChangeFile = this.editor.update.renderedState.value.dataProvider != this.editor.update.intermediateState.value.dataProvider;
        if (didChangeFile && this.editor.scrollBarType.value == "native"){
            this.editor.changeNativeScrollerPosition(this.editor.update.intermediateState.value.positionInFile, this.editor.update.intermediateState.value.dataProvider.size);
        } else if (this.editor.scrollBarType.value == "virtual") {
            this.editor.dom.innerContainer.scrollTop = 0;
        }
        
        this.boxCaches.clear();
        this.redraw();
    
        this.editor.update.renderedState.value = this.editor.update.intermediateState.value;
    }
    redraw(): void {
        const ctx = this.editor.dom.ctx;
        const canvas = this.editor.dom.canvas;
    
        this.editor.dom.canvas.width = this.editor.update.intermediateState.value.width;
        this.editor.dom.canvas.height = this.editor.update.intermediateState.value.height;
        this.editor.dom.canvas.style.setProperty("--device-pixel-ratio",window.devicePixelRatio.toString())
    
        ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-background-color");
        ctx.fillRect(0,0,canvas.width,canvas.height);
    
        {
            const box = this.getByteCountContainer();
            ctx.strokeStyle = getCssString(this.editor.dom.innerContainer,"--editor-border-color");
            ctx.strokeRect(...box.border.arr);
            ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-row-number-background-color");
            ctx.fillRect(...box.border.arr);
        }
        {
            const box = this.getCharsContainer();
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
    
        for(let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++){
            const value = this.editor.data.getRenderByte(renderIndex * bytesPerRow + byteIndex);
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
    createByteCountContainer(): BoundingBox {
        const anyByteCount = this.getAnyByteCountBox();
        
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: anyByteCount.outer.width,
            innerHeight: this.editor.dom.canvas.height,
            paddingLeft: 4 * this.unit,
            paddingRight: 4 * this.unit
        })
    }
    
    getByteCountContainer(): BoundingBox {
        return this.getCachedBox("single","byteCountContainer",this.createByteCountContainer.bind(this))
    }
    createAnyByteCountBox(){
        const ctx = this.editor.dom.ctx;
    
        const count = this.getByteCountOfRow(this.editor.size.viewportRowCount);
        ctx.font = this.getByteCountFont();
        const text = this.getPaddedByteCount(count);
        const size = ctx.measureText(text);
        const textWidth = size.width;
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: textWidth,
            innerHeight: rowHeight * this.unit,
            paddingLeft: 4 * this.unit,
            paddingRight: 4 * this.unit
        })
    }
    getAnyByteCountBox(){
        return this.getCachedBox("single","anyByteCount",this.createAnyByteCountBox.bind(this));
    }
    createByteCountBox(y: number){
        const container = this.getByteCountContainer();
        const anyByteCount = this.getAnyByteCountBox();
    
        return new BoundingBox({
            outerLeft: container.inner.left,
            outerTop: container.inner.top + this.getRowPosition(y) * this.unit,
            innerWidth: anyByteCount.inner.width,
            innerHeight: anyByteCount.inner.height,
            paddingLeft: anyByteCount.paddingLeft,
            paddingRight: anyByteCount.paddingRight,
        })
    }
    getByteCountBox(y: number): BoundingBox {
        return this.getCachedBox("byteCount",y,this.createByteCountBox.bind(this,y));
    }
    createBytesContainer() {
        const count = this.getByteCountContainer();
        const anyByte = this.getAnyByteBox();

        return new BoundingBox({
            outerLeft: count.outer.right,
            outerTop: 0,
            innerWidth: anyByte.outer.width * this.bytesPerRow,
            innerHeight: rowHeight * this.unit,
            paddingLeft: 6 * this.unit,
            paddingRight: 6 * this.unit,
        })
    }
    getCachedBox(cacheId: string, key: unknown, create: ()=>BoundingBox): BoundingBox {
        let map = this.boxCaches.get(cacheId);
        if (!map){
            map = new Map();
            this.boxCaches.set(cacheId,map);
        }
        let item = map.get(key);
        if (!item) {
            item = create();
            map.set(key,item);
        }
        return item;
    }
    getBytesContainer(){
        return this.getCachedBox("single","bytesContainer",this.createBytesContainer.bind(this));
    }
    createAnyByteBox(): BoundingBox {
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: getCssNumber(this.editor.dom.innerContainer,"--editor-byte-width") * this.unit,
            innerHeight: rowHeight * this.unit,
        })
    }
    getAnyByteBox(): BoundingBox {
        return this.getCachedBox("single","anyByteBox",this.createAnyByteBox.bind(this));
    }
    getByteBoxId(y: number,x: number){
        return y * this.bytesPerRow + x;
    }
    createByteBox(y: number,x: number){
        const bytesContainer = this.getBytesContainer();
        const anyByte = this.getAnyByteBox();

        return new BoundingBox({
            outerLeft: bytesContainer.inner.left + x * anyByte.outer.width,
            outerTop: bytesContainer.inner.top + y * anyByte.outer.height,
            innerWidth: anyByte.inner.width,
            innerHeight: anyByte.inner.height,
        })
    }
    getByteBox(y: number,x: number): BoundingBox {
        const id = this.getByteBoxId(y,x);
        return this.getCachedBox("bytes",id,this.createByteBox.bind(this,y,x));
    }
    createAnyCharBox(){
        const charWidth = getCssNumber(this.editor.dom.innerContainer,"--editor-char-width") * this.unit;
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: charWidth,
            innerHeight: rowHeight * this.unit
        })
    }
    getAnyCharBox(): BoundingBox {
        return this.getCachedBox("single","anyCharBox",this.createAnyCharBox.bind(this));
    }
    createCharsContainer() {
        const pos = this.getBytesContainer();
        const anyCharBox = this.getAnyCharBox();
    
        return new BoundingBox({
            outerLeft: pos.outer.right,
            outerTop: 0,
            innerWidth: anyCharBox.inner.width * this.bytesPerRow,
            innerHeight: this.editor.dom.canvas.height,
            paddingLeft: 6 * this.unit,
            paddingRight: 6 * this.unit,
        })
    }
    getCharsContainer(){
        return this.getCachedBox("single","charsContainer",this.createCharsContainer.bind(this));
    }
    createCharBox(y: number,x: number){
        const top = this.getRowPosition(y);
        const charsBox = this.getCharsContainer();
        const anyCharBox = this.getAnyCharBox();
    
        return new BoundingBox({
            outerLeft: charsBox.inner.left + anyCharBox.outer.width * x,
            outerTop: top * this.unit,
            innerWidth: anyCharBox.inner.width,
            innerHeight: anyCharBox.inner.height
        })
    }
    getCharBox(y: number,x: number): BoundingBox {
        const id = y * this.bytesPerRow + x;
        return this.getCachedBox("chars",id,this.createCharBox.bind(this,y,x));
    }
    getByteCountOfRow(renderIndex: number){
        return renderIndex * this.bytesPerRow + this.editor.update.intermediateState.value.positionInFile;
    }
    getPaddedByteCount(count: number){
        return toHex(count).padStart(getCssNumber(this.editor.dom.innerContainer,"--editor-row-number-digit-count"),'0');
    }
    getByteCountFont() {
        return `${getCssNumber(this.editor.dom.innerContainer,"--editor-font-size") * this.unit}px ${getCssString(this.editor.dom.innerContainer,"--editor-font-family")}`
    }
    drawHover(box: Box){
        const ctx = this.editor.dom.ctx;
        ctx.strokeStyle = getCssString(this.editor.dom.innerContainer,"--editor-select-border-color");
        ctx.lineWidth = 1*this.unit;
        ctx.strokeRect(...box.arr);
    }
    drawCursor(box: Box){
        const ctx = this.editor.dom.ctx;
        ctx.strokeStyle = getCssString(this.editor.dom.innerContainer,"--editor-cursor-border-color");
        ctx.lineWidth = 1*this.unit;
        ctx.strokeRect(...box.arr);
    }
    drawSelection(box: Box){
        const ctx = this.editor.dom.ctx;
        ctx.fillStyle = getCssString(this.editor.dom.innerContainer,"--editor-cursor-background-color");
        ctx.fillRect(...box.arr);
    }
    drawByteCount(renderIndex: number): void {
        const ctx = this.editor.dom.ctx;
    
        const count = this.getByteCountOfRow(renderIndex);
    
        const text = this.getPaddedByteCount(count);
        ctx.font = this.getByteCountFont();
        
        const pos = this.getByteCountBox(renderIndex);
    
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
        const ctx = this.editor.dom.ctx;
        const { value, renderIndex, byteIndex } = props;
    
        if (value == undefined){
            return;
        }
    
        const pos = this.getByteBox(renderIndex,byteIndex);
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
        const ctx = this.editor.dom.ctx;
    
        const { value, renderIndex, byteIndex } = props;
    
        if (value == undefined){
            return;
        }

        const pos = this.getCharBox(renderIndex,byteIndex);

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
