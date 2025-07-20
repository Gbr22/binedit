import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomManager";
import { StateManager } from "./subsystems/StateManager";
import { ScrollManager } from "./subsystems/ScrollManager";
import { RenderingManager } from "./subsystems/RenderingManager";
import { GestureManager } from "./subsystems/GestureManager";
import { DataManager } from "./subsystems/DataManager";
import { SelectionManager } from "./subsystems/SelectionManager";
import { EditManager } from "./subsystems/EditManager";
import { dispose, type Disposable, disposeChildren } from "./dispose";

export class Editor implements Disposable {
    data = new DataManager(this);
    event = new StateManager(this);
    selection = new SelectionManager(this);
    dom = new DomManager(this);
    size = new SizeManager(this);
    rendering = new RenderingManager(this);
    scroll = new ScrollManager(this);
    gesture = new GestureManager(this);
    edit = new EditManager(this);

    constructor(){}

    [dispose] = disposeChildren.bind(null,this)
}
