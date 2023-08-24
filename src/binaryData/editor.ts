import { ImplCreateDom } from "./sub-classes/DomHandler";
import { ImplScrollHandler } from "./sub-classes/ScrollHandler";
import { Implementations } from "./composition";
import { ImplSizeHandler } from "./sub-classes/SizeHandler";
import { ImplDataHandler } from "./sub-classes/DataHandler";
import { ImplRenderingHandler } from "./sub-classes/RenderingHandler";
import { ImplUpdateHandler } from "./sub-classes/UpdateHandler";
import { ImplEventHandler } from "./sub-classes/EventHandler";

export type EditorThis = InstanceType<typeof Editor>;

export class Editor
extends Implementations
    (ImplCreateDom)
    (ImplScrollHandler)
    (ImplSizeHandler)
    (ImplDataHandler)
    (ImplRenderingHandler)
    (ImplUpdateHandler)
    (ImplEventHandler)
.$
{
    constructor(){
        super();

        this.initDomHandler();
        this.initScrollHandler();
        this.initSizeHandler();
        this.initUpdateHandler();
    }
}