import { patchDataHandler, type IDataHandler } from "./interfaces/DataHandler";
import { patchDomHandler, type IDomHandler } from "./interfaces/DomHandler";
import { patchScrollHandler, type IScrollHandler } from "./interfaces/ScrollHandler";
import { patchSizeHandler, type ISizeHandler } from "./interfaces/SizeHandler";
import { patchRenderingHandler, type IRenderingHandler } from "./interfaces/RenderingHandler";
import { patchUpdateHandler, type IUpdateHandler } from "./interfaces/UpdateHandler";
import { patchEventHandler, type IEventHandler } from "./interfaces/EventHandler";

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