<template v-if="state.currentFile">
    <div ref="container" class="editor"></div>
</template>

<script setup lang="ts">
import { editor } from '@/state';
import { onMounted, ref } from 'vue';

const container = ref<HTMLElement>();
onMounted(()=>{
    if (container.value){
        container.value.appendChild(editor.dom.element);
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
