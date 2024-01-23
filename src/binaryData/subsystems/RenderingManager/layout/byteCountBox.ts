import { BoundingBox, CachedBoundingBox, CachedBoundingBoxes } from "../box";
import type { Layout } from "../layout";

export function anyByteCountBox(layout: Layout) {
    return new CachedBoundingBox(()=>{
        const ctx = layout.ctx;
        const count = layout.getByteCountDigitCount();
        ctx.font = layout.styles.byteCount.font;
        const text = layout.getPaddedByteCount(count);
        const size = ctx.measureText(text);
        const textWidth = size.width;
        return new BoundingBox({
            outerLeft: 0,
            outerTop: 0,
            innerWidth: textWidth,
            innerHeight: layout.rowHeight * layout.unit,
            paddingLeft: 4 * layout.unit,
            paddingRight: 4 * layout.unit
        })
    })
}

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