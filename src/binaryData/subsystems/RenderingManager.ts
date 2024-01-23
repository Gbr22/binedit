import { Editor } from "../editor";
import { emptyCssCache } from "@/theme";
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

        const { sizes, styles, layout, renderer } = this.createRenderer();
        this.sizes = sizes;
        this.styles = styles;
        this.layout = layout;
        this.renderer = renderer;
    }

    createRenderer(){
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
            height: this.editor.update.intermediateState.value.width,
            styles: styles,
            sizes: sizes,
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            dataProvider: this.editor.update.intermediateState.value.dataProvider,
        })
        const state = new State({
            positionInFile: this.editor.update.intermediateState.value.positionInFile,
            currentHover: this.editor.gesture.mouse.currentHover
        });
        const renderer = new Renderer({
            layout,
            styles,
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            editor: this.editor,
            state
        });
        return {
            sizes,
            styles,
            layout,
            renderer
        }
    }
    
    reflow(): void {
        emptyCssCache();
        this.devicePixelRatio = window.devicePixelRatio;
        this.editor.dom.innerContainer.dataset["scrollType"] = `${this.editor.scroll.scrollBarType.value}`;
        
        this.editor.dom.scrollView.style.setProperty('--row-count',this.editor.scroll.scrollRowCount.value.toString());
        
        const didChangeFile = this.editor.update.renderedState.value.dataProvider != this.editor.update.intermediateState.value.dataProvider;
        if (didChangeFile && this.editor.scroll.scrollBarType.value == "native"){
            this.editor.scroll.changeNativeScrollerPosition(this.editor.update.intermediateState.value.positionInFile, this.editor.update.intermediateState.value.dataProvider.size);
        } else if (this.editor.scroll.scrollBarType.value == "virtual") {
            this.editor.dom.innerContainer.scrollTop = 0;
        }
        
        const result = this.createRenderer();
        Object.assign(this,result);

        this.renderer.draw();
    
        this.editor.update.renderedState.value = this.editor.update.intermediateState.value;
    }
    redraw(){
        const state = new State({
            positionInFile: this.editor.update.intermediateState.value.positionInFile,
            currentHover: this.editor.gesture.mouse.currentHover
        });
        const renderer = new Renderer({
            ctx: this.editor.dom.ctx,
            canvas: this.editor.dom.canvas,
            state,
            styles: this.styles,
            layout: this.layout,
            editor: this.editor
        })
        this.renderer = renderer;
        this.renderer.draw();
    }
}
