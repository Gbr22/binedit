import { BoundingBox, CachedBoundingBox } from "../box";
import type { Layout } from "../layout";

export function anyByteBox(layout: Layout){
    return new CachedBoundingBox(()=>{
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: layout.styles.editorByteWidth * layout.unit,
            innerHeight: layout.rowHeight * layout.unit,
        })
    })
}