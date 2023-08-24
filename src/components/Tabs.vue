<template>
    <div class="tabs">
        <div
            class="tab"
            v-for="file in state.files" draggable="true"
            :class="{
                'drop-target': file == dropTarget,
                active: state.currentFile == file
            }"
            @click="openFile(file)"
            @mouseup="onClick($event,file)"
            @dragstart="onDragStart($event,file)"
            @drop="onDrop($event,file)"
            @dragover="onDragOver($event,file)"
            @dragend="onDragEnd()"
        >
            <div class="text">{{ file.name }}</div>
            <button
                class="close"
                @click="closeFile(file)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="space"
            :class="{
                'drop-target': dropTarget == 'Space',
            }"
            @drop="onDrop($event,'Space')"
            @dragover="onDragOver($event,'Space')"
        ></div>
    </div>
</template>

<script setup lang="ts">
import type { EditorFile } from '@/binaryData/EditorFile';
import { state } from '@/state';
import { ref } from 'vue';

function openFile(file: EditorFile){
    state.currentFile = file;
}
function onClick(event: MouseEvent, file: EditorFile){
    if (event.button === 1){
        event.preventDefault();
        closeFile(file);
    }
}

type DragTarget = EditorFile | "Space";

let dragFile: EditorFile | undefined;
let dropTarget = ref<DragTarget | undefined>();

function onDrop(event: MouseEvent, dragTarget: DragTarget){
    event.preventDefault();
    if (dragFile){
        const tragetFile = dragTarget == "Space" ? state.files.at(-1) as EditorFile : dragTarget;
        const sourceIndex = state.files.findIndex(e=>e===dragFile);
        const targetIndex = state.files.findIndex(e=>e===tragetFile);
        state.files[sourceIndex] = tragetFile;
        state.files[targetIndex] = dragFile;
    }
    dragFile = undefined;
}
function closeFile(file: EditorFile){
    const index = state.files.findIndex(e=>e === file);
    state.files.splice(index,1);
    if (file == state.currentFile){
        state.currentFile = undefined;
    }
}

async function onDragStart(event: DragEvent, file: EditorFile){
    if (event.dataTransfer){
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.clearData();
        event.dataTransfer.items.add(await file.dataSource.asFile(file.name));
        dragFile = file;
    }
}
function onDragOver(event: DragEvent, file: DragTarget){
    event.preventDefault();
    dropTarget.value = file;
}

function onDragEnd(){
    dropTarget.value = undefined;
}

</script>

<style scoped lang="scss">
.tabs {
    height: 35px;
    width: 100%;
    display: flex;
    flex-direction: row;
    user-select: none;
    .space {
        flex: 1;
    }
    .tab {
        overflow: hidden;
        display: grid;
        align-items: center;
        grid-template-columns: 1fr auto;
        background-color: inherit;
        border: none;
        padding-left: 8px;
        padding-right: 5px;
        gap: 5px;
        border-top: 1.5px solid transparent;
        border-right: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;

        .text {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            width: max-content;
            max-width: 100px;
            font-size: 13px;
            color: #959595;
            pointer-events: none;
        }
        .close {
            position: relative;
            right: 0;
            width: 21px;
            height: 21px;
            border-radius: 5px;
            border: none;
            display: grid;
            place-content: center;
            font-size: 18px;
            color: #999999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease, background-color 0.2s ease;
            background-color: transparent;
            cursor: pointer;

            .feather {
                width: 16px;
                height: 16px;
            }

            &:hover {
                background-color: #313232;
            }
        }
        &:hover .close {
            opacity: 1;
            pointer-events: all;
        }

        &.active {
            background-color: #1F1F1F;
            border-top-color: #0078D4;
            color: #5ac6f0;
            color: #CE834A;
            border-bottom-color: transparent;

            .text {
                color: white;
            }
        }
    }
    .tab, .space {
        background-color: #181818;
    }
    .drop-target {
        filter: brightness(150%) grayscale(50%);
    }
}
</style>