import { assertEquals } from "jsr:@std/assert/equals";
import { asBytes, assertConsistency, createRange, createRanges, deleteRanges, dropEnd, dropStart, moveTo, RangeSource, split } from "./editing.ts";

function deleteBytes(bytes: Uint8Array, start: number, end: number): Uint8Array {
    return new Uint8Array([...bytes.slice(0, start), ...bytes.slice(end)]);
}

type Action<OperationArgs extends unknown[] = unknown[]> = {
    name?: string;
    byteFn: (bytes: Uint8Array, ...args: OperationArgs) => Uint8Array;
    rangeFn: (ranges: RangeSource[], ...args: OperationArgs) => RangeSource[];
    expected?: Uint8Array | string;
    args: OperationArgs;
}

function parse(bytes: Uint8Array | string): string {
    if (typeof bytes === "string") {
        return bytes;
    }
    return new TextDecoder().decode(bytes);
}

function print(bytes: Uint8Array | string): string {
    return JSON.stringify(parse(bytes));
}

async function testActions<Actions extends Action<any[]>[]>(input: Uint8Array | string, actions: Actions) {
    const inputBytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
    const inputRanges = createRanges(inputBytes);
    let bytes = inputBytes;
    let ranges = inputRanges;
    let index = 0;
    for (const action of actions) {
        bytes = await action.byteFn(bytes, ...action.args);
        if (action.expected) {
            const givenExpected = await parse(action.expected);
            assertEquals(givenExpected, parse(bytes), `The test is written incorrectly, computed expected bytes should be equal to the given expected bytes, but they are not: computed: ${print(bytes)}, expected: ${print(givenExpected)}`);
        }
        
        ranges = await action.rangeFn(ranges, ...action.args);
        assertConsistency(ranges);
        const rangeBytes = await asBytes(ranges);
        assertEquals(
            rangeBytes, bytes,
            `Resulting bytes do not match computed expected bytes for action ${action.name ?? index}, actual range bytes: ${print(rangeBytes)}, expected: ${print(bytes)}`
        );
        index++;
    }
    const resultBytes = await asBytes(ranges);
    assertEquals(resultBytes, bytes, "Resulting bytes do not match expected bytes");
}

async function asText(ranges: RangeSource[]): Promise<string> {
    return new TextDecoder().decode(await asBytes(ranges));
}

Deno.test(function testDeleteBytes() {
    const input = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const output = deleteBytes(input, 3, 3+3);
    const expected = new Uint8Array([0, 1, 2, 6, 7, 8, 9]);
    assertEquals(output, expected, `Expected ${print(expected)}, got ${print(output)}`);
});

Deno.test(async function testSplit() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    const ranges = split(range, first.length);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), dataSource);
    assertEquals(await asText([ranges[0]]), first);
    assertEquals(await asText([moveTo(ranges[1], 0)]), second);
});

Deno.test(async function testDropStart() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const toDrop = " fox jumps";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    const ranges = split(range, first.length);
    ranges[1] = dropStart(ranges[1], toDrop.length);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), dataSource.replace(toDrop, ""));
    assertEquals(await asText([ranges[0]]), first);
    assertEquals(await asText([moveTo(ranges[1], 0)]), second.replace(toDrop, ""));
});

Deno.test(async function testDropEnd() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const toDrop = "lazy dog";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    const ranges = split(range, first.length);
    ranges[1] = dropEnd(ranges[1], toDrop.length);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), dataSource.replace(toDrop, ""));
    assertEquals(await asText([ranges[0]]), first);
    assertEquals(await asText([moveTo(ranges[1], 0)]), second.replace(toDrop, ""));
});

Deno.test(async function testRangeCompletelyInDelete() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    let ranges: RangeSource[] = split(range, first.length);
    ranges = deleteRanges(ranges, first.length-1, dataSource.length+1);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), "The quick brow");
});

Deno.test(async function testDeleteRangeEqualsRange() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    let ranges: RangeSource[] = split(range, first.length);
    ranges = deleteRanges(ranges, first.length, dataSource.length);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), first);
});

Deno.test(async function testDeleteAcrossRanges() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    let ranges: RangeSource[] = split(range, first.length);
    const deleteRange: [number, number] = [first.length-2, first.length+2];
    ranges = deleteRanges(ranges, ...deleteRange);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), "The quick broox jumps over the lazy dog");
});

Deno.test(async function testDeleteRangeStart() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    let ranges: RangeSource[] = split(range, first.length);
    ranges = deleteRanges(ranges, first.length, first.length+2);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), "The quick brownox jumps over the lazy dog");
});

Deno.test(async function testDeleteRangeEnd() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    let ranges: RangeSource[] = split(range, first.length);
    ranges = deleteRanges(ranges, first.length-2, first.length);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), "The quick bro fox jumps over the lazy dog");
});

Deno.test(async function testIsDeleteCompletelyInRange() {
    const first = "The quick brown";
    const second = " fox jumps over the lazy dog";
    const toDelete = "lazy";
    const dataSource = first + second;
    const range = createRange(new TextEncoder().encode(dataSource));
    let ranges: RangeSource[] = split(range, first.length);
    ranges = deleteRanges(ranges, dataSource.indexOf(toDelete), dataSource.indexOf(toDelete) + toDelete.length);
    assertConsistency(ranges);
    assertEquals(await asText(ranges), dataSource.replace(toDelete, ""));
});

Deno.test(async function testSplitAndDeleteAcross() {
    //                   0123456789
    const inputString = "Left|Right";
    //                  "|________|"
	await testActions(inputString, [
        {
            name: "Delete 't|R' (split in middle)",
            //         0123456
            expected: "Lefight",
            //        "|_||__|"
            byteFn: deleteBytes,
            rangeFn: deleteRanges,
            args: ["Left|Right".indexOf("t|R"), "Left|Right".indexOf("t|R")+"t|R".length]
        },
        {
            name: "Delete 'fi'",
            //         01234
            expected: "Leght",
            //        "\/|_|"
            byteFn: deleteBytes,
            rangeFn: deleteRanges,
            args: ["Lefight".indexOf("fi"), "Lefight".indexOf("fi")+"fi".length]
        },
    ]);
});
