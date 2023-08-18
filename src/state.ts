import { reactive } from "vue";
import type { EditorFile } from "./EditorFile";

export const state = reactive({
    files: [] as EditorFile[],
    currentFile: undefined as EditorFile | undefined
})