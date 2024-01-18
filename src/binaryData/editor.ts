import { DataHandler } from "./subsystems/DataHandler";
import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomHandler";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingHandler } from "./subsystems/RenderingHandler";
import { UpdateHandler } from "./subsystems/UpdateHandler";
import { MouseHandler } from "./subsystems/MouseHandler";
import { KeyboardHandler } from "./subsystems/KeyboardHandler";
import { DisposeHandler } from "./subsystems/DisposeHandler";

import { type CombinedSubsystems, Subsystems } from "./composition";
import { SelectionManager } from "./subsystems/SelectionManager";

const subsystems = new Subsystems(
    DisposeHandler,
    RenderingHandler,
    DataHandler,
    EventHandler,
    UpdateHandler,
    ScrollHandler,
    MouseHandler,
    KeyboardHandler
);

type EditorSubsystems = CombinedSubsystems<typeof subsystems>;

export interface Editor extends EditorSubsystems {}

export class Editor {
    selection = new SelectionManager(this);
    dom = new DomManager(this);
    size = new SizeManager(this);

    constructor(){
        subsystems.init(this);
    }
}

subsystems.attach(Editor);
