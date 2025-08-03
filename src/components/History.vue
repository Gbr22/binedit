<script setup lang="ts">
import { ChangeTypes, type HistoryItem } from '@/binaryData/subsystems/EditManager';
import { editor, state } from '@/state';

function getEntryDescription(entry: HistoryItem): string {
    return entry.changes.map(e=>{
        const change = e.change;
        if (change.type === ChangeTypes.insert) {
            return `Insert ${change.size} bytes at ${change.at}`;
        }
        else if (change.type === ChangeTypes.delete) {
            return `Delete ${change.size} bytes at ${change.at}`;
        }
        else if (change.type === ChangeTypes.modify) {
            return `Modify ${change.at} bytes at ${change.at}`;
        }
        else if (change.type === ChangeTypes.open) {
            return `Open document`;
        }
        else {
            return "Unknown change";
        }
    }).join(", ");
}
</script>

<template>
    <div class="root">
        <div class="entries" v-if="state.activeTab?.history">
            <template v-for="entry, index in state.activeTab.history.entries">
                <div
                    class="entry"
                    @click="editor.history.entryPointer = index"
                    :class="{ active: state.activeTab?.history.entryPointer === index }"
                >
                    <div class="bg"></div>
                    <span class="text">{{ getEntryDescription(entry) }}</span>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
.root {
    .entries {
        display: flex;
        flex-direction: column;
        font-size: 14px;

        .entry {
            padding: 0.5em;
            position: relative;

            .bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0.1;
            }

            &.active {
                .text {
                    font-weight: bold;
                }
                .bg {
                    background-color: var(--foreground-primary-color);
                }
            }
        }
    }
}
</style>