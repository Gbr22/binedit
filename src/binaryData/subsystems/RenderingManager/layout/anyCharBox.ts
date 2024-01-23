import { BoundingBox, CachedBoundingBox } from "../box";
import type { Layout } from "../layout";

export function anyCharBox(layout: Layout){
    return new CachedBoundingBox(()=>{
        const charWidth = layout.styles.editorCharWidth * layout.unit;
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: charWidth,
            innerHeight: layout.rowHeight * layout.unit
        })
    })
}