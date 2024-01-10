import { DataHandler } from "./subsystems/DataHandler";
import { SizeHandler } from "./subsystems/SizeHandler";
import { DomHandler } from "./subsystems/DomHandler";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingHandler } from "./subsystems/RenderingHandler";
import { UpdateHandler } from "./subsystems/UpdateHandler";

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
