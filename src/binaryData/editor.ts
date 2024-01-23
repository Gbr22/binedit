import { SizeManager } from "./subsystems/SizeManager";
import { DomManager } from "./subsystems/DomManager";
import { EventManager } from "./subsystems/EventManager";
import { ScrollManager } from "./subsystems/ScrollManager";
import { RenderingManager } from "./subsystems/RenderingManager";
import { GestureManager } from "./subsystems/GestureManager";
import { UpdateManager } from "./subsystems/UpdateManager";
import { DataManager } from "./subsystems/DataManager";
import { SelectionManager } from "./subsystems/SelectionManager";

import { dispose, type Disposable, disposeChildren } from "./dispose";

export class Editor implements Disposable {
    data = new DataManager(this);
    update = new UpdateManager(this);
    event = new EventManager(this);
    selection = new SelectionManager(this);
    dom = new DomManager(this);
    scroll = new ScrollManager(this);
    size = new SizeManager(this);
    gesture = new GestureManager(this);
    rendering = new RenderingManager(this);

    constructor(){

    }

    [dispose] = disposeChildren.bind(null,this)
}
