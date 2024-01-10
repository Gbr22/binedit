import { DataHandler } from "./interfaces/DataHandler";
import { SizeHandler } from "./interfaces/SizeHandler";
import { DomHandler } from "./interfaces/DomHandler";
import { EventHandler } from "./interfaces/EventHandler";
import { ScrollHandler } from "./interfaces/ScrollHandler";
import { RenderingHandler } from "./interfaces/RenderingHandler";
import { UpdateHandler } from "./interfaces/UpdateHandler";

import { type CombinedSubsystems, Subsystems } from "./composition";

const subsystems = new Subsystems(
    RenderingHandler,
    DataHandler,
    DomHandler,
    SizeHandler,
    EventHandler,
    UpdateHandler,
    ScrollHandler,
);

type EditorSubsystems = CombinedSubsystems<typeof subsystems>;

export interface Editor extends EditorSubsystems {}

export class Editor {
    constructor(){
        subsystems.init(this);
    }
}

subsystems.attach(Editor);
