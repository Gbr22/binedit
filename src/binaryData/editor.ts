import { DataHandler } from "./subsystems/DataHandler";
import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomHandler";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingManager } from "./subsystems/RenderingManager";
import { UpdateHandler } from "./subsystems/UpdateHandler";
import { KeyboardHandler } from "./subsystems/KeyboardHandler";
import { DisposeHandler } from "./subsystems/DisposeHandler";

import { type CombinedSubsystems, Subsystems } from "./composition";
import { SelectionManager } from "./subsystems/SelectionManager";
import { dispose, type Disposable, disposeChildren } from "./dispose";
import { GestureManager } from "./subsystems/GestureManager";

const subsystems = new Subsystems(
    DisposeHandler,
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
