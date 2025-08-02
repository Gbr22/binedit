interface RangeDataSource {
    slice(from: number, to: number): Promise<Uint8Array>;
    size: number;
};

export interface RangeDataProvider {
    slice(from: number, to: number): Promise<Uint8Array>;
    subProvider(from: number, to?: number): RangeDataProvider;
    size: number;
};

export class WrappedDataProvider implements RangeDataProvider {
    #from: number;
    #to: number;
    source: RangeDataSource;

    get size() {
        return this.#to - this.#from;
    }

    constructor(source: RangeDataSource, options?: { from?: number, to?: number }) {
        this.source = source;
        this.#from = options?.from ?? 0;
        this.#to = options?.to ?? source.size;
    }

    #validateSliceIndices(from: number, to: number): [number, number] {
        if (from < 0 || to < 0) {
            throw new Error(`Slice indices cannot be negative: from=${from}, to=${to}`);
        }
        if ((to - from) < 0) {
            throw new Error(`Slice cannot have negative length: from=${from}, to=${to}`);
        }
        if (to > this.size) {
            to = this.size;
        }
        if (from > this.size) {
            from = this.size;
        }
        return [from, to];
    }

    async slice(from: number, to: number): Promise<Uint8Array> {
        [from, to] = this.#validateSliceIndices(from, to);
        const adjustedFrom = this.#from + from;
        const adjustedTo = this.#from + to;
        return await this.source.slice(adjustedFrom, adjustedTo);
    }

    subProvider(from: number, to?: number): RangeDataProvider {
        to = to ?? Infinity;
        [from, to] = this.#validateSliceIndices(from, to);
        const adjustedFrom = this.#from + from;
        const adjustedTo = this.#from + to;
        return new WrappedDataProvider(this.source, {
            from: adjustedFrom,
            to: adjustedTo,
        });
    }
}

export interface RangeSource {
    from: number;
    to: number;
    dataProvider: RangeDataProvider;
};

function isInRange(range: [number, number], point: number): boolean {
    const [from, to] = range;
    return point >= from && point < to;
}

export function createRange(source: Uint8Array): RangeSource {
    return {
        from: 0,
        to: source.length,
        dataProvider: new WrappedDataProvider({
            slice: (from, to) => Promise.resolve(source.slice(from, to)),
            size: source.length
        })
    };
}

export function createRanges(source: Uint8Array): RangeSource[] {
    return [createRange(source)];
}

export function moveTo(range: RangeSource, documentFrom: number) {
    if (documentFrom < 0) {
        throw new Error(`Document from cannot be negative: ${documentFrom}`);
    }
    const length = range.to - range.from;
    return {
        from: documentFrom,
        to: documentFrom + length,
        dataProvider: range.dataProvider
    };
}

export function split(source: RangeSource, indexInRange: number): [RangeSource, RangeSource] {
    const length = source.to - source.from;
    if (indexInRange < 0 || indexInRange >= length) {
        throw new Error(`Index ${indexInRange} is out of bounds for range [${source.from}, ${source.to}]`);
    }
    const left: RangeSource = {
        from: source.from,
        to: source.from + indexInRange,
        dataProvider: source.dataProvider.subProvider(0, indexInRange)
    };
    const right: RangeSource = {
        from: source.from + indexInRange,
        to: source.to,
        dataProvider: source.dataProvider.subProvider(indexInRange)
    };
    return [left, right];
}

export function dropStart(range: RangeSource, count: number): RangeSource {
    if (count < 0) {
        throw new Error(`Count cannot be negative: ${count}`);
    }
    const length = range.to - range.from;
    if (count > length) {
        throw new Error(`Drop count ${count} is greater than range length ${length}`);
    }
    return {
        from: range.from,
        to: range.to - count,
        dataProvider: range.dataProvider.subProvider(count)
    };
}

export function dropEnd(range: RangeSource, count: number): RangeSource {
    if (count < 0) {
        throw new Error(`Count cannot be negative: ${count}`);
    }
    const length = range.to - range.from;
    if (count > length) {
        throw new Error(`Drop count ${count} is greater than range length ${length}`);
    }
    return {
        from: range.from,
        to: range.to - count,
        dataProvider: range.dataProvider.subProvider(0, length - count)
    };
}

export function subtract(ranges: RangeSource, ammount: number): RangeSource {
    return {
        from: ranges.from - ammount,
        to: ranges.to - ammount,
        dataProvider: ranges.dataProvider
    };
}

export function add(ranges: RangeSource, ammount: number): RangeSource {
    return {
        from: ranges.from + ammount,
        to: ranges.to + ammount,
        dataProvider: ranges.dataProvider
    };
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
            throw new Error(`Ranges are not contiguous: ${prev.to} != ${range.from}, ranges: ${JSON.stringify(ranges.map(e=>[e.from, e.to]))}`);
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
        const dataToPut = await range.dataProvider.slice(startInRange, endInRange);
        result.set(dataToPut, offset);
        offset += dataToPut.length;
    }

    return result;
}

export function isFromWithinRange(from: number, other: [number, number]): boolean {
    return isInRange(other, from);
}

export function isToWithinRange(to: number, other: [number, number]): boolean {
    return isInRange(other, to - 1);
}

export function isRangeWithinRange(small: [number, number], big: [number, number]): boolean {
    const [smallFrom, smallTo] = small;
    const [bigFrom, bigTo] = big;
    return smallFrom >= bigFrom && smallTo <= bigTo;
}

function range(from: number, to: number): [number, number] {
    if (to < from) {
        throw new Error(`Range cannot have negative length: from=${from}, to=${to}`);
    }
    return [from, to];
}

export function deleteRanges(ranges: RangeSource[], deleteFrom: number, deleteTo: number): RangeSource[] {
    const deleteRange = range(deleteFrom, deleteTo);
    const deleteCount = deleteTo - deleteFrom;
    const newRanges: RangeSource[] = [];
    for (const range of ranges) {
        const r: [number, number] = [range.from, range.to];
        const isFromWithinDelete = isFromWithinRange(range.from, deleteRange);
        const isToWithinDelete = isToWithinRange(range.to, deleteRange);
        if (isFromWithinDelete && isToWithinDelete) {
            continue;
        }
        else if (isRangeWithinRange(deleteRange, r)) {
            let [left, right] = split(range, deleteFrom - range.from);
            right = dropStart(right, deleteCount);
            const leftLength = left.to - left.from;
            const rightLength = right.to - right.from;
            if (leftLength > 0) {
                newRanges.push(left);
            }
            if (rightLength > 0) {
                newRanges.push(right);
            }
            if (rightLength <= 0 && leftLength <= 0) {
                throw new Error("Both left and right ranges are empty after delete operation");
            }
        }
        else if (isFromWithinDelete) {
            const localDeleteCount = deleteTo - range.from;
            const shiftCount = deleteCount - localDeleteCount;
            const newRange = subtract(dropStart(range, localDeleteCount), shiftCount);
            newRanges.push(newRange);
        }
        else if (isToWithinDelete) {
            const localDeleteCount = range.to - deleteFrom;
            const newRange = dropEnd(range, localDeleteCount);
            newRanges.push(newRange);
        }
        else if (range.to <= deleteFrom) {
            newRanges.push(range);
        }
        else if (range.from >= deleteTo) {
            const newRange = subtract(range, deleteCount);
            newRanges.push(newRange);
        }
        else {
            throw new Error(
                `Unexpected range state: ${JSON.stringify(range)} with context: ${JSON.stringify({
                    isFromWithinDelete,
                    isToWithinDelete,
                    deleteFrom,
                    deleteTo,
                })}`
            );
        }
    }
    return newRanges;
}
