import { Editor } from "../editor";
import { TrackedVar, struct, type Struct } from "../reactivity";
import { BlobProvider, type DataProvider } from "../dataProvider";

export interface State {
    positionInFile: number
    dataProvider: DataProvider
    width: number
    height: number
}

function createDefaultState(): Struct<State> {
    return struct({
        positionInFile: 0,
        dataProvider: new BlobProvider(new Blob([])),
        width: 0,
        height: 0,
    })
}

export class UpdateManager {
    desiredState = new TrackedVar(createDefaultState());
    intermediateState = new TrackedVar(createDefaultState());
    renderedState = new TrackedVar(createDefaultState());

    editor: Editor;

    constructor(editor: Editor){
        this.editor = editor;

        this.desiredState.subscribe(()=>{
            this.intermediateState.value = this.desiredState.value;
        })
        this.intermediateState.subscribe(async ()=>{
            if (!this.intermediateState.value.dataProvider){
                return;
            }
            this.intermediateState.lock();
            this.editor.data.dataToRender.value = await this.editor.data.getRenderPage(
                this.intermediateState.value.dataProvider,
                this.intermediateState.value.positionInFile
            );
        })
        this.editor.data.dataToRender.subscribe(()=>{
            requestAnimationFrame(()=>{
                this.editor.renderer.reflow();
            })
        })
        this.renderedState.subscribe(()=>{
            this.intermediateState.unlock();
            this.intermediateState.value = this.desiredState.value;
        })
    }
}
