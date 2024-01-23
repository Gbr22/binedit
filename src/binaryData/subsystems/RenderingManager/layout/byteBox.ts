import { BoundingBox, CachedBoundingBox, CachedBoundingBoxes } from "../box";
import type { Layout } from "../layout";

export function anyByteBox(layout: Layout){
    return new CachedBoundingBox(()=>{
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: layout.styles.byte.width * layout.unit,
            innerHeight: layout.rowHeight * layout.unit,
        })
    })
}

export function byteBox(layout: Layout){
    return new CachedBoundingBoxes((y: number, x: number)=>{
        const bytesContainer = layout.bytesContainer.value;
        const anyByte = layout.anyByteBox.value;

        return new BoundingBox({
            outerLeft: bytesContainer.inner.left + x * anyByte.outer.width,
            outerTop: bytesContainer.inner.top + y * anyByte.outer.height,
            innerWidth: anyByte.inner.width,
            innerHeight: anyByte.inner.height,
        })
    },layout.yxToScalar.bind(layout))
}