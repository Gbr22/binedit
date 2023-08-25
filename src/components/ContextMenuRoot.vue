<template>
    <div
        class="context-menu"
        v-if="state.visible"
        :style="{
            '--top': state.y+'px',
            '--left': state.x+'px'
        }"
        ref="menuRef"
    >
        <ContextMenu :menu="state.menu" />
    </div>
</template>

<script setup lang="ts">
import { contextMenuState as state, closeMenu } from '@/contextMenu';
import ContextMenu from './ContextMenu.vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';

let menuRef = ref<HTMLDivElement>();

function onClick(e: MouseEvent){
    const path = e.composedPath();
    if (path.includes(menuRef.value as HTMLElement)){
        return;
    }
    closeMenu();
}

onMounted(()=>{
    window.addEventListener("click",onClick);
})
onBeforeUnmount(()=>{
    window.removeEventListener("click",onClick);
})
</script>

<style scoped lang="scss">
.context-menu {
    position: fixed;
    top: var(--top);
    left: var(--left);
    z-index: 999999;
    
}
</style>