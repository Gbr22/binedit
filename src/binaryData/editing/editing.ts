export interface RangeSource {
    from: number;
    to: number;
    slice(from: number, to: number): Promise<Uint8Array>;
};

function isInRange(range: [number, number], index: number): boolean {
    const [from, to] = range;
    return index >= from && index < to;
}

export function createRanges(source: Uint8Array): RangeSource[] {
    return [{
        from: 0,
        to: source.length,
        slice: (from, to) => {
            return Promise.resolve(source.slice(from, to));
        }
    }];
}

export function getSize(ranges: RangeSource[]): number {
    if (ranges.length === 0) {
        return 0;
    }
    const last = ranges[ranges.length - 1];
    return last.to;
}

export function assertConsistency(ranges: RangeSource[], options?: {
    size?: number
}): void {
    let sum = 0;
    let prev;
    for (const range of ranges) {
        if (prev && prev.to != range.from) {
            throw new Error(`Ranges are not contiguous: ${prev.to} != ${range.from}`);
        }
        if (!prev && range.from !== 0) {
            throw new Error(`First range does not start at 0: ${range.from}`);
        }
        sum += range.to - range.from;
        prev = range;
    }
    if (options?.size != undefined && sum !== options?.size) {
        throw new Error(`Size mismatch after delete: expected ${options.size}, got ${sum}`);
    }
}

export async function asBytes(ranges: RangeSource[]): Promise<Uint8Array> {
    const size = getSize(ranges);
    return await sliceRanges(ranges, 0, size);
}

export async function sliceRanges(ranges: RangeSource[], from: number, to: number): Promise<Uint8Array> {
    if (ranges.length === 0) {
        return new Uint8Array(0);
    }
    const last = ranges[ranges.length - 1];
    const size = last.to;

    to = Math.min(to, size);
    const length = to - from;
    const result = new Uint8Array(length);
    let offset = 0;

    for (const range of ranges) {
        const rangeLength = range.to - range.from;
        if (range.to < from) {
            continue;
        }
        if (range.from >= to) {
            break;
        }
        let startInRange = 0;
        if (range.from < from) {
            startInRange = from - range.from;
        }
        let endInRange = rangeLength;
        if (range.to > to) {
            endInRange = to - range.from;
        }
        const dataToPut = await range.slice(startInRange, endInRange);
        result.set(dataToPut, offset);
        offset += dataToPut.length;
    }

    return result;
}

export function deleteRanges(ranges: RangeSource[], deleteFrom: number, deleteTo: number): RangeSource[] {
    if (deleteFrom < 0 || deleteTo < 0) {
        throw new Error(`Delete range cannot have negative indices: from=${deleteFrom}, to=${deleteTo}`);
    }
    const length = deleteTo - deleteFrom;
    if (length <= 0) {
        throw new Error(`Delete range must have positive length: ${length}`);
    }
    const debug = false;
    const deleteLength = deleteTo - deleteFrom;
    if (debug) {
        console.debug("Deleting range", { deleteFrom, deleteTo, deleteLength });
    }
    if (deleteLength <= 0) {
        throw new Error(`Delete range must have positive length: ${deleteLength}`);
    }
    const newRanges: RangeSource[] = [];
    const isInDelete = isInRange.bind(null, [deleteFrom, deleteTo]);
    for (const range of ranges) {
        const r: [number, number] = [range.from, range.to];
        const isToWithinDelete = range.to > deleteFrom && range.to <= deleteTo;
        const isFromWithinDelete = range.from >= deleteFrom && range.from < deleteTo;
        if (isFromWithinDelete && isToWithinDelete) {
            continue;
        }
        
        if (range.to <= deleteFrom) {
            if (debug) {
                console.debug("Range not affected by delete", range);
            }
            newRanges.push(range);
        }
        else if (range.from >= deleteTo) {
            const newRange: RangeSource = {
                from: range.from - deleteLength,
                to: range.to - deleteLength,
                slice: range.slice
            }
            if (debug) {
                console.debug("Range over deleteTo", "old", range, "new", newRange);
            }
            newRanges.push(newRange);
        }
        else if (isInRange(r, deleteFrom) && isInRange(r, deleteTo)) {
            if (debug) {
                console.debug("Delete is within range", range);
            }
            const leftFrom = range.from;
            const leftTo = deleteFrom;
            const leftLength = leftTo - leftFrom;
            if (leftLength > 0) {
                const left: RangeSource = {
                    from: leftFrom,
                    to: leftTo,
                    slice: range.slice
                };
                newRanges.push(left);
            }
            const oldLength = range.to - range.from;
            const rightFrom = deleteFrom;
            const dataShiftedBy = deleteLength + leftLength;
            if (dataShiftedBy < 0) {
                throw new Error(`Data shift cannot be negative: ${dataShiftedBy}`);
            }
            const rightTo = rightFrom + oldLength - dataShiftedBy;
            const rightLength = rightTo - rightFrom;
            if (rightLength > 0) {
                const right: RangeSource = {
                    from: rightFrom,
                    to: rightTo,
                    slice: (from, to) => {
                        if (from < 0 || to < 0) {
                            throw new Error(`Slice indices cannot be negative: from=${from}, to=${to}`);
                        }
                        return range.slice(from+dataShiftedBy, to+dataShiftedBy)
                    }
                };
                newRanges.push(right);
            }
            if (rightLength <= 0 && leftLength <= 0) {
                throw new Error("Both left and right ranges are empty after delete operation");
            }
        }
        else if (isFromWithinDelete) {
            const oldLength = range.to - range.from;
            const oldFrom = range.from;
            const newFrom = deleteFrom;
            const deleteCount = deleteTo - oldFrom;
            const newTo = newFrom + oldLength - deleteCount;
            const newRange: RangeSource = {
                from: newFrom,
                to: newTo,
                slice: (from, to) => range.slice(from + deleteCount, to + deleteCount)
            }
            if (debug) {
                console.debug("Range starts within delete", "old", range, "new", newRange, "delete", deleteCount);
            }
            newRanges.push(newRange);
        }
        else if (isToWithinDelete) {
            const newTo = deleteFrom;
            const newRange: RangeSource = {
                from: range.from,
                to: newTo,
                slice: (from, to) => range.slice(from, to)
            }
            if (debug) {
                console.debug("Range ends within delete", "old", range, "new", newRange);
            }
            newRanges.push(newRange);
        }
        else {
            throw new Error(
                `Unexpected range state: ${JSON.stringify(range)} with context: ${JSON.stringify({
                    "isInDelete(range.from)": isInDelete(range.from),
                    "isInDelete(range.to)": isInDelete(range.to),
                    deleteFrom: deleteFrom,
                    deleteTo: deleteTo,
                })}`
            );
        }
    }
    return newRanges;
}
