import { DataHandler } from "./subsystems/DataHandler";
import { SizeManager } from "./subsystems/SizeManager";
import { DomHandler } from "./subsystems/DomHandler";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingHandler } from "./subsystems/RenderingHandler";
import { UpdateHandler } from "./subsystems/UpdateHandler";
import { MouseHandler } from "./subsystems/MouseHandler";
import { KeyboardHandler } from "./subsystems/KeyboardHandler";
import { DisposeHandler } from "./subsystems/DisposeHandler";

import { type CombinedSubsystems, Subsystems, defineSubsystem } from "./composition";
import { SelectionManager } from "./subsystems/SelectionManager";

const Managers = defineSubsystem({
    name: "EditorProps",
    proto: {},
    init(this: Editor) {
        return {
            selection: new SelectionManager(this),
            size: new SizeManager(this)
        }
    },
});

const subsystems = new Subsystems(
    Managers,
    DisposeHandler,
    RenderingHandler,
    DataHandler,
    DomHandler,
    EventHandler,
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
