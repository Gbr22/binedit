import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomManager";
import { EventManager } from "./subsystems/EventManager";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingManager } from "./subsystems/RenderingManager";
import { GestureManager } from "./subsystems/GestureManager";
import { UpdateManager } from "./subsystems/UpdateManager";
import { DataManager } from "./subsystems/DataManager";
import { SelectionManager } from "./subsystems/SelectionManager";

import { type CombinedSubsystems, Subsystems } from "./composition";
import { dispose, type Disposable, disposeChildren } from "./dispose";

const subsystems = new Subsystems(
    ScrollHandler,
);

type EditorSubsystems = CombinedSubsystems<typeof subsystems>;

export interface Editor extends EditorSubsystems {}

export class Editor implements Disposable {
    data = new DataManager(this);
    update = new UpdateManager(this);
    event = new EventManager(this);
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
