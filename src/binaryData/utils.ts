export function putBytes(target: Uint8Array, offset: number, source: Uint8Array) {
    const maxLength = target.length - offset;
    target.set(source.slice(0, maxLength), offset);
}
