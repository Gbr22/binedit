import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomManager";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingManager } from "./subsystems/RenderingManager";
import { GestureManager } from "./subsystems/GestureManager";
import { UpdateHandler } from "./subsystems/UpdateHandler";

import { type CombinedSubsystems, Subsystems } from "./composition";
import { SelectionManager } from "./subsystems/SelectionManager";
import { dispose, type Disposable, disposeChildren } from "./dispose";
import { DataManager } from "./subsystems/DataManager";

const subsystems = new Subsystems(
    EventHandler,
    UpdateHandler,
    ScrollHandler,
);

type EditorSubsystems = CombinedSubsystems<typeof subsystems>;

export interface Editor extends EditorSubsystems {}

export class Editor implements Disposable {
    data = new DataManager(this);
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
