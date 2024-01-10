import { DataHandler } from "./interfaces/DataHandler";
import { SizeHandler } from "./interfaces/SizeHandler";
import { DomHandler } from "./interfaces/DomHandler";
import { EventHandler } from "./interfaces/EventHandler";
import { ScrollHandler } from "./interfaces/ScrollHandler";
import { RenderingHandler } from "./interfaces/RenderingHandler";
import { UpdateHandler } from "./interfaces/UpdateHandler";

import { type CombinedSubsystemInterface, Subsystems, attachSubsystems } from "./composition";

const subsystems = Subsystems(
    RenderingHandler,
    DataHandler,
    DomHandler,
    SizeHandler,
    EventHandler,
    UpdateHandler,
    ScrollHandler,
);

type Combined = CombinedSubsystemInterface<typeof subsystems>;

export interface Editor
extends Combined {}

export class Editor
{
    constructor(){
        this.RenderingHandler.init();
        this.DataHandler.init();
        this.DomHandler.init();
        this.SizeHandler.init();
        this.EventHandler.init();
        this.UpdateHandler.init();
        this.ScrollHandler.init();
    }
}

attachSubsystems(Editor,subsystems);
