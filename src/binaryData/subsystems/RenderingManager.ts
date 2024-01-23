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

        const { sizes, styles, layout, renderer } = this.createRendererSync({
            state: this.createStateSync({
                dataToRender: new Uint8Array()
            })
        });
        this.sizes = sizes;
        this.styles = styles;
        this.layout = layout;
        this.renderer = renderer;
    }
    createStateSync({dataToRender}: {dataToRender: Uint8Array}){
        return new State({
            positionInFile: this.editor.update.intermediateState.value.positionInFile,
            currentHover: this.editor.gesture.mouse.currentHover,
            pendingSelectionRanges: this.editor.selection.pendingRanges,
            selectionRanges: this.editor.selection.ranges,
            cursorPosition: this.editor.selection.cursorPosition,
            dataToRender: dataToRender,
            dataProvider: this.editor.update.intermediateState.value.dataProvider
        })
    }
    async createStateAsync(){
        const dataToRender = await this.editor.data.getRenderPage(
            this.editor.update.intermediateState.value.dataProvider,
            this.editor.update.intermediateState.value.positionInFile
        )
        return this.createStateSync({dataToRender});
    }
    async createRendererAsync(){
        const state = await this.createStateAsync();
        return this.createRendererSync({state});
    }
    createRendererSync({ state }: { state: State }){
        const sizes = new Sizes({
            devicePixelRatio: this.devicePixelRatio,
            scale: this.scale
        })
        const styles = new Styles({
            sizes: sizes,
            editor: this.editor
        })
        const layout = new Layout({
            width: this.editor.update.intermediateState.value.width,
            height: this.editor.update.intermediateState.value.height,
            styles: styles,
            sizes: sizes,
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            dataProvider: this.editor.update.intermediateState.value.dataProvider,
        })
        const renderer = new Renderer({
            layout,
            styles,
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            state
        });
        return {
            sizes,
            styles,
            layout,
            renderer
        }
    }
    
    async reflow() {
        this.devicePixelRatio = window.devicePixelRatio;
        this.editor.dom.innerContainer.dataset["scrollType"] = `${this.editor.scroll.scrollBarType.value}`;
        
        this.editor.dom.scrollView.style.setProperty('--row-count',this.editor.scroll.scrollRowCount.value.toString());
        
        const didChangeFile = this.editor.update.renderedState.value.dataProvider != this.editor.update.intermediateState.value.dataProvider;
        if (didChangeFile && this.editor.scroll.scrollBarType.value == "native"){
            this.editor.scroll.changeNativeScrollerPosition(this.editor.update.intermediateState.value.positionInFile, this.editor.update.intermediateState.value.dataProvider.size);
        } else if (this.editor.scroll.scrollBarType.value == "virtual") {
            this.editor.dom.innerContainer.scrollTop = 0;
        }
        
        const result = await this.createRendererAsync();
        Object.assign(this,result);
        this.renderer.canvas.width = this.layout.width;
        this.renderer.canvas.height = this.layout.height;
        this.renderer.canvas.style.setProperty("--device-pixel-ratio",String(this.devicePixelRatio));

        this.renderer.draw();
    
        this.editor.update.renderedState.value = this.editor.update.intermediateState.value;
    }
    async redraw(){
        const state = await this.createStateAsync();
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
