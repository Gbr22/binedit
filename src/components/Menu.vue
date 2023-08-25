<template>
    <div>
        <button @click="onOpenFile">
            Open file
        </button>
    </div>
</template>

<script setup lang="ts">
import { TabData } from '@/TabData';
import { openFiles } from '../openFile';
import { editor, state } from '@/state';
import { switchTab } from '@/tabs';

function onOpenFile(){
    openFiles().then(files=>{
        const tabs = files.map(file=>new TabData(file.name,file));
        for (let tab of tabs){
            state.tabs.push(tab);
        }
        const last = tabs.at(-1);
        if (last) {
            switchTab(last);
        }
        
    })
}

</script>

<style scoped lang="scss">

</style>