import { ImplCreateDom } from "./sub-classes/DomHandler";
import { DerivedVar, TrackedVar, createDependantFunction } from "./reactivity";
import { bytesPerRow } from "./constants";
import { getRowIndex, toHex, type Row, type Printable, byteToPrintable } from "./row";
import { ImplScrollHandler } from "./sub-classes/ScrollHandler";
import { Implementations } from "./composition";
import { ImplSizeHandler } from "./sub-classes/SizeHandler";
import { ImplFileHandler } from "./sub-classes/FileHandler";
import { ImplRenderingHandler } from "./sub-classes/RenderingHandler";
import { ImplUpdateHandler } from "./sub-classes/UpdateHandler";

export type EditorThis = InstanceType<typeof Editor>;

export class Editor
extends Implementations
    (ImplCreateDom)
    (ImplScrollHandler)
    (ImplSizeHandler)
    (ImplFileHandler)
    (ImplRenderingHandler)
    (ImplUpdateHandler)
.$
{
    constructor(){
        super();

        this.initDomHandler();
        this.initScrollHandler();
        this.initSizeHandler();
        this.initUpdateHandler();
    }
}