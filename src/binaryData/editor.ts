import { DataHandler } from "./subsystems/DataHandler";
import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomHandler";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingManager } from "./subsystems/RenderingManager";
import { GestureManager } from "./subsystems/GestureManager";
import { UpdateHandler } from "./subsystems/UpdateHandler";
import { KeyboardHandler } from "./subsystems/KeyboardHandler";

import { type CombinedSubsystems, Subsystems } from "./composition";
import { SelectionManager } from "./subsystems/SelectionManager";
import { dispose, type Disposable, disposeChildren } from "./dispose";

const subsystems = new Subsystems(
    DataHandler,
    EventHandler,
    UpdateHandler,
    ScrollHandler,
    KeyboardHandler
);

type EditorSubsystems = CombinedSubsystems<typeof subsystems>;

export interface Editor extends EditorSubsystems {}

export class Editor implements Disposable {
    selection = new SelectionManager(this);
    dom = new DomManager(this);
    size = new SizeManager(this);
    gesture = new GestureManager(this);
    renderer = new RenderingManager(this);

    constructor(){
        subsystems.init(this);
    }

    [dispose] = disposeChildren.bind(null,this)
}

subsystems.attach(Editor);
