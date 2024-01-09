import { patchDataHandler, type IDataHandler } from "./sub-classes/DataHandler";
import { patchDomHandler, type IDomHandler } from "./sub-classes/DomHandler";
import { patchScrollHandler, type IScrollHandler } from "./sub-classes/ScrollHandler";
import { patchSizeHandler, type ISizeHandler } from "./sub-classes/SizeHandler";
import { patchRenderingHandler, type IRenderingHandler } from "./sub-classes/RenderingHandler";
import { patchUpdateHandler, type IUpdateHandler } from "./sub-classes/UpdateHandler";
import { patchEventHandler, type IEventHandler } from "./sub-classes/EventHandler";

export interface Editor
extends
    IDomHandler,
    IScrollHandler,
    ISizeHandler,
    IDataHandler,
    IRenderingHandler,
    IUpdateHandler,
    IEventHandler
{}

export class Editor
{
    constructor(){
        this.initRenderingHandler();
        this.initDataHandler();
        this.initDomHandler();
        this.initSizeHandler();
        this.initUpdateHandler();
        this.initScrollHandler();
    }
}

patchDataHandler();
patchDomHandler();
patchScrollHandler();
patchSizeHandler();
patchRenderingHandler();
patchUpdateHandler();
patchEventHandler();