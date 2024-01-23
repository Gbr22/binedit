import { BoundingBox, CachedBoundingBox, CachedBoundingBoxes } from "../box";
import type { Layout } from "../layout";

export function anyCharBox(layout: Layout){
    return new CachedBoundingBox(()=>{
        const charWidth = layout.styles.char.width * layout.unit;
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: charWidth,
            innerHeight: layout.rowHeight * layout.unit
        })
    })
}

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