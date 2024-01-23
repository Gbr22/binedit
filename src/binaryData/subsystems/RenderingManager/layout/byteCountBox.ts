import { BoundingBox, CachedBoundingBoxes } from "../box";
import type { Layout } from "../layout";

export function byteCountBox(layout: Layout) {
    return new CachedBoundingBoxes((y: number)=>{
        const container = layout.byteCountContainer.value;
        const anyByteCount = layout.anyByteCountBox.value;
    
        return new BoundingBox({
            outerLeft: container.inner.left,
            outerTop: container.inner.top + layout.getRowPosition(y) * layout.unit,
            innerWidth: anyByteCount.inner.width,
            innerHeight: anyByteCount.inner.height,
            paddingLeft: anyByteCount.paddingLeft,
            paddingRight: anyByteCount.paddingRight,
        })
    },Number)
}