import { DataHandler } from "./interfaces/DataHandler";
import { SizeHandler } from "./interfaces/SizeHandler";
import { patchDomHandler, type IDomHandler } from "./interfaces/DomHandler";
import { patchScrollHandler, type IScrollHandler } from "./interfaces/ScrollHandler";
import { patchRenderingHandler, type IRenderingHandler } from "./interfaces/RenderingHandler";
import { patchUpdateHandler, type IUpdateHandler } from "./interfaces/UpdateHandler";
import { patchEventHandler, type IEventHandler } from "./interfaces/EventHandler";
import { type CombinedSubsystemInterface, Subsystems, applySubsystems } from "./composition";

const subsystems = Subsystems(
    DataHandler,
    SizeHandler
);

type Combined = CombinedSubsystemInterface<typeof subsystems>;

export interface Editor
extends
    Combined,
    IDomHandler,
    IScrollHandler,
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

applySubsystems(Editor,subsystems);

patchDomHandler();
patchScrollHandler();
patchRenderingHandler();
patchUpdateHandler();
patchEventHandler();