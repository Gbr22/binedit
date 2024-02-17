import { Editor } from "../editor";
import { Layout } from "./RenderingManager/layout";
import { Styles } from "./RenderingManager/styles";
import { Renderer } from "./RenderingManager/renderer";
import { State } from "./RenderingManager/state";
import { Sizes } from "./RenderingManager/sizes";

export class RenderingManager {
    editor: Editor;

    devicePixelRatio = window.devicePixelRatio;
    scale = 1;
    get unit() { return this.layout.unit }

    sizes: Sizes;
    styles: Styles;
    layout: Layout;
    renderer: Renderer;

    constructor(editor: Editor) {
        this.editor = editor;

        this.sizes = this.createSizes();
        this.styles = this.createStyles(this.sizes);
        this.layout = this.createLayout(this.sizes,this.styles);
        this.renderer = this.createRenderer(this.styles,this.layout,State.empty());
    }
    async createState(){
        const dataToRender = await this.editor.data.getRenderPage(
            this.editor.data.provider,
            this.editor.scroll.positionInFile
        )
        return new State({
            positionInFile: this.editor.scroll.positionInFile,
            currentHover: this.editor.gesture.mouse.currentHover,
            pendingSelectionRanges: this.editor.selection.pendingRanges,
            selectionRanges: this.editor.selection.ranges,
            cursorPosition: this.editor.selection.cursorPosition,
            dataToRender: dataToRender,
            dataProvider: this.editor.data.provider
        })
    }
    createSizes(){
        return new Sizes({
            devicePixelRatio: this.devicePixelRatio,
            scale: this.scale
        })
    }
    createStyles(sizes: Sizes){
        return new Styles({
            sizes: sizes,
            editor: this.editor
        })
    }
    createLayout(sizes: Sizes, styles: Styles){
        return new Layout({
            width: this.editor.size.width,
            height: this.editor.size.height,
            styles: styles,
            sizes: sizes,
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            dataProvider: this.editor.data.provider,
        })
    }
    createRenderer(styles: Styles, layout: Layout, state: State){
        return new Renderer({
            layout,
            styles,
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            state
        });
    }
    async createRendererAsync(){
        const state = await this.createState();
        const sizes = this.createSizes();
        const styles = this.createStyles(sizes);
        const layout = this.createLayout(sizes,styles);
        const renderer = this.createRenderer(styles,layout,state);
        return {
            sizes,
            styles,
            layout,
            renderer
        }
    }
    
    async reflow() {
        this.devicePixelRatio = window.devicePixelRatio;
        
        const result = await this.createRendererAsync();
        Object.assign(this,result);
        this.renderer.canvas.width = this.layout.width;
        this.renderer.canvas.height = this.layout.height;
        this.renderer.canvas.style.setProperty("--device-pixel-ratio",String(this.devicePixelRatio));

        this.renderer.draw();
    }
    async redraw(){
        const state = await this.createState();
        const renderer = new Renderer({
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            state,
            styles: this.styles,
            layout: this.layout,
        })
        this.renderer = renderer;
        this.renderer.draw();
    }
}
