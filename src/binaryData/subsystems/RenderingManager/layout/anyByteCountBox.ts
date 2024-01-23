import { BoundingBox, CachedBoundingBox } from "../box";
import type { Layout } from "../layout";

export function anyByteCountBox(layout: Layout) {
    return new CachedBoundingBox(()=>{
        const ctx = layout.ctx;
        const count = layout.getByteCountDigitCount();
        ctx.font = layout.styles.getByteCountFont();
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