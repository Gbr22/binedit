import { DataHandler } from "./subsystems/DataHandler";
import { SizeHandler } from "./subsystems/SizeHandler";
import { DomHandler } from "./subsystems/DomHandler";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingHandler } from "./subsystems/RenderingHandler";
import { UpdateHandler } from "./subsystems/UpdateHandler";
import { MouseHandler } from "./subsystems/MouseHandler";
import { SelectionHandler } from "./subsystems/SelectionHandler";
import { KeyboardHandler } from "./subsystems/KeyboardHandler";
import { DisposeHandler } from "./subsystems/DisposeHandler";

import { type CombinedSubsystems, Subsystems } from "./composition";

const subsystems = new Subsystems(
    DisposeHandler,
    RenderingHandler,
    DataHandler,
    DomHandler,
    SizeHandler,
    EventHandler,
    SelectionHandler,
    UpdateHandler,
    ScrollHandler,
    MouseHandler,
    KeyboardHandler
);

type EditorSubsystems = CombinedSubsystems<typeof subsystems>;

export interface Editor extends EditorSubsystems {}

export class Editor {
    constructor(){
        subsystems.init(this);
    }
}

subsystems.attach(Editor);
