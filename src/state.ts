import { reactive } from "vue";

export type File = {
    name: string
    blob: Blob
}

export const state = reactive({
    files: [] as File[],
    currentFile: undefined as File | undefined
})