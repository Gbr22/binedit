import { BoundingBox, CachedBoundingBox } from "../box";
import type { Layout } from "../layout";

export function charsContainer(layout: Layout){
    return new CachedBoundingBox(()=>{
        const pos = layout.bytesContainer.value;
        const anyCharBox = layout.anyCharBox.value;
    
        return new BoundingBox({
            outerLeft: pos.outer.right,
            outerTop: 0,
            innerWidth: anyCharBox.inner.width * layout.bytesPerRow,
            innerHeight: layout.height,
            paddingLeft: 6 * layout.unit,
            paddingRight: 6 * layout.unit,
        })
    })
}