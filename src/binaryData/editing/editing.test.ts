import { assertEquals } from "jsr:@std/assert/equals";
import { asBytes, assertConsistency, createRanges, deleteRanges, RangeSource } from "./editing.ts";

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
        ranges = await action.rangeFn(inputRanges, ...action.args);
        const rangeBytes = await asBytes(ranges);
        assertEquals(
            rangeBytes, bytes,
            `Resulting bytes do not match computed expected bytes for action ${action.name ?? index}, range bytes: ${print(rangeBytes)}, expected: ${print(bytes)}`
        );
        if (action.expected) {
            const expectedBytes = typeof action.expected === "string" ? new TextEncoder().encode(action.expected) : action.expected;
            assertEquals(
                rangeBytes,
                expectedBytes,
                `Resulting bytes do not match given expected bytes for action ${action.name ?? index}, range bytes: ${print(rangeBytes)}, expected: ${print(expectedBytes)}`
            );
        }
        assertConsistency(inputRanges);
        index++;
    }
    const resultBytes = await asBytes(ranges);
    assertEquals(resultBytes, bytes, "Resulting bytes do not match expected bytes");
}

Deno.test(function testDeleteBytes() {
    const input = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const output = deleteBytes(input, 3, 3+3);
    const expected = new Uint8Array([0, 1, 2, 6, 7, 8, 9]);
    assertEquals(output, expected, `Expected ${print(expected)}, got ${print(output)}`);
});

Deno.test(async function testSplitAndStartWithinAndEndWithin() {
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
            args: [3, 3+3]
        },
        {
            name: "Delete 'fi'",
            //         01234
            expected: "Leght",
            //        "\/|_|"
            byteFn: deleteBytes,
            rangeFn: deleteRanges,
            args: [2, 2+2]
        },
    ]);
});
