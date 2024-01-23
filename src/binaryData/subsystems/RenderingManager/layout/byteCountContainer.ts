import { BoundingBox, CachedBoundingBox } from "../box";
import type { Layout } from "../layout";

export function byteCountContainer(layout: Layout){
    return new CachedBoundingBox(()=>{
        const anyByteCount = layout.anyByteCountBox.value;
        
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: anyByteCount.outer.width,
            innerHeight: layout.height,
            paddingLeft: 4 * layout.unit,
            paddingRight: 4 * layout.unit
        })
    })
}