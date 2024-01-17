import { DataHandler } from "./subsystems/DataHandler";
import { SizeHandler } from "./subsystems/SizeHandler";
import { DomHandler } from "./subsystems/DomHandler";
import { EventHandler } from "./subsystems/EventHandler";
import { ScrollHandler } from "./subsystems/ScrollHandler";
import { RenderingHandler } from "./subsystems/RenderingHandler";
import { UpdateHandler } from "./subsystems/UpdateHandler";
import { MouseHandler } from "./subsystems/MouseHandler";
import { KeyboardHandler } from "./subsystems/KeyboardHandler";
import { DisposeHandler } from "./subsystems/DisposeHandler";

import { type CombinedSubsystems, Subsystems, defineSubsystem } from "./composition";
import { SelectionHandler } from "./subsystems/SelectionHandler";

const EditorProps = defineSubsystem({
    name: "EditorProps",
    proto: {},
    init(this: Editor) {
        return {
            selectionHandler: new SelectionHandler(this)
        }
    },
});

const subsystems = new Subsystems(
    EditorProps,
    DisposeHandler,
    RenderingHandler,
    DataHandler,
    DomHandler,
    SizeHandler,
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
