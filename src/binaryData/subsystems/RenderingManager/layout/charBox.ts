import { BoundingBox, CachedBoundingBoxes } from "../box";
import type { Layout } from "../layout";

export function charBox(layout: Layout){
    return new CachedBoundingBoxes((y: number, x: number)=>{
        const top = layout.getRowPosition(y);
        const charsBox = layout.charsContainer.value;
        const anyCharBox = layout.anyCharBox.value;
    
        return new BoundingBox({
            outerLeft: charsBox.inner.left + anyCharBox.outer.width * x,
            outerTop: top * layout.unit,
            innerWidth: anyCharBox.inner.width,
            innerHeight: anyCharBox.inner.height
        })
    },layout.yxToScalar.bind(layout))
}