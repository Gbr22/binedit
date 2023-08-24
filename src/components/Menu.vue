<template>
    <div>
        <button @click="onOpenFile">
            Open file
        </button>
    </div>
</template>

<script setup lang="ts">
import { TabData } from '@/TabData';
import { openFile } from '../openFile';
import { editor, state } from '@/state';
import { switchTab } from '@/tabs';

function onOpenFile(){
    openFile().then(file=>{
        const tab = new TabData(file.name,file);
        state.tabs.push(tab);
        switchTab(tab);
    })
}

</script>

<style scoped lang="scss">

</style>