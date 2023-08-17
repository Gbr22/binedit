import { reactive } from "vue";

export type File = {
    name: string
    buffer: ArrayBuffer
}

export const state = reactive({
    files: [] as File[],
    currentFile: undefined as File | undefined
})