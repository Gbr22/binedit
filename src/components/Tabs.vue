<template>
    <div class="tabs"
        ref="tabsRef"
        @wheel="onWheel($event)"
    >
        <div class="inner">
            <div
                class="tab"
                v-for="tab in state.tabs" draggable="true"
                :class="{
                    'drop-target': tab == dropTarget,
                    active: state.activeTab == tab
                }"
                @mousedown="onMouseDown($event,tab)"
                @mouseup="onMouseUp($event,tab)"
                @dragstart="onDragStart($event,tab)"
                @drop="onDrop($event,tab)"
                @dragover="onDragOver($event,tab)"
                @dragend="onDragEnd()"
                @contextmenu="openMenu($event,{
                    sections: [
                        {
                            items: [
                                {
                                    name: 'Close',
                                    fn() {
                                        closeTab(tab)
                                    },
                                },
                                {
                                    name: 'Close All',
                                    fn() {
                                        closeTab(tab)
                                    },
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    name: 'Rename',
                                    fn() {
                                        
                                    },
                                },
                                {
                                    name: 'Resize',
                                    fn() {
                                        
                                    },
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    name: 'Save',
                                    fn() {
                                        
                                    },
                                },
                                {
                                    name: 'Save as',
                                    fn() {
                                        
                                    },
                                },
                            ]
                        }
                    ]
                })"
            >
                <div class="text">{{ tab.name }}</div>
                <button
                    class="close"
                    @click="closeTab(tab)"
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
    </div>
</template>

<script setup lang="ts">
import { TabData } from '@/TabData';
import { openMenu } from '@/contextMenu';
import { state } from '@/state';
import { closeTab, switchTab } from '@/tabs';
import { ref } from 'vue';

const tabsRef = ref<HTMLDivElement>();

function onWheel(event: WheelEvent){
    event.preventDefault();
    if (!tabsRef.value){
        return;
    }
    const delta = event.deltaY;
    tabsRef.value.scrollBy({
        left: delta,
    })
}

function onMouseDown(event: MouseEvent,tab: TabData){
    if (event.button === 1){
        event.preventDefault();
    }
    switchTab(tab);
}
function onMouseUp(event: MouseEvent, file: TabData){
    if (event.button === 1){
        event.preventDefault();
        closeTab(file);
    }
}

type DragTarget = TabData | "Space";

let dragFile: TabData | undefined;
let dropTarget = ref<DragTarget | undefined>();

function onDrop(event: MouseEvent, dragTarget: DragTarget){
    event.preventDefault();
    if (dragFile){
        const tragetFile = dragTarget == "Space" ? state.tabs.at(-1) as TabData : dragTarget;
        const sourceIndex = state.tabs.findIndex(e=>e===dragFile);
        const targetIndex = state.tabs.findIndex(e=>e===tragetFile);
        state.tabs[sourceIndex] = tragetFile;
        state.tabs[targetIndex] = dragFile;
    }
    dragFile = undefined;
}

async function onDragStart(event: DragEvent, file: TabData){
    if (event.dataTransfer){
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.clearData();
        event.dataTransfer.items.add(new File([await file.dataSource.getBlob()], file.name));
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
    max-width: 100%;
    user-select: none;
    overflow-x: auto;
    overflow-y: hidden;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    scrollbar-width: none;
    background-color: var(--tab-bar-background-color);

    &::-webkit-scrollbar {
        height: 0;
        width: 0;
    }

    .inner {
        display: flex;
        flex-direction: row;
        width: max-content;
        overflow-y: hidden;
        min-width: 100%;
    }

    .space {
        flex: 1;
        background-color: var(--tab-bar-background-color);
        border-bottom: 1px solid var(--border-color);

        &.drop-target {
            background-color: color-mix(in srgb, var(--tab-bar-background-color), 8% var(--mixer-foreground));
        }
    }
    .tab {
        overflow: hidden;
        display: grid;
        align-items: center;
        grid-template-columns: 1fr auto;
        background-color: var(--tab-background-color);
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
            color: color-mix(in srgb, var(--foreground-color), 32% var(--mixer-background));
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
            color: color-mix(in srgb, var(--foreground-color), 28% var(--mixer-background));
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
                background-color: color-mix(in srgb, var(--tab-background-color), 10% var(--mixer-foreground));
            }
        }
        &:hover .close {
            opacity: 1;
            pointer-events: all;
        }
        &.drop-target {
            background-color: color-mix(in srgb, var(--tab-background-color), 8% var(--mixer-foreground));
        }
        &.active {
            background-color: var(--tab-active-background-color);
            border-top-color: var(--foreground-primary-color);
            border-bottom-color: transparent;

            .text {
                color: var(--intense-foreground-color);
            }
        }
    }
}
</style>