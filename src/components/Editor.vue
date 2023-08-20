<template v-if="state.currentFile">
    <div ref="container" class="editor"></div>
</template>

<script setup lang="ts">
import { state } from '@/state';
import { onMounted, ref, watch } from 'vue';
import { Editor } from '../binaryData/editor';
const editor = new Editor();

watch(state, ()=>{
    editor.currentFile.value = state.currentFile;
})

const container = ref<HTMLElement>();
onMounted(()=>{
    if (container.value){
        container.value.appendChild(editor.element);
    }
})
</script>

<style scoped lang="scss">
.editor {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    overflow: hidden;
}
</style>