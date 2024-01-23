import { BoundingBox, CachedBoundingBox } from "../box";
import type { Layout } from "../layout";

export function bytesContainer(layout: Layout){
    return new CachedBoundingBox(()=>{
        const count = layout.byteCountContainer.value;
        const anyByte = layout.anyByteBox.value;

        return new BoundingBox({
            outerLeft: count.outer.right,
            outerTop: 0,
            innerWidth: anyByte.outer.width * layout.bytesPerRow,
            innerHeight: layout.rowHeight * layout.unit,
            paddingLeft: 6 * layout.unit,
            paddingRight: 6 * layout.unit,
        })
    })
}