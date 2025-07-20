<script setup lang="ts">
import { state } from '@/state';
import { formatHex, formatInt, formatUnit } from '@/format';
</script>

<template>
    <div class="file-info data-table" v-if="state.activeTab">
        <div>File name</div>
        <div class="name">
            {{ state.activeTab.name }}
        </div>
        <div>File size</div>
        <div>
            {{ formatInt(state.activeTab.dataSource.size) }} bytes
            ({{ formatUnit(state.activeTab.dataSource.size) }})
        </div>
        <div>Scroll position</div>
        <div>
            {{ formatHex(state.activeTab.positionInFile) }}
        </div>
        <div>Cursor position</div>
        <div>
            {{ formatHex(state.activeTab.cursorPosition) }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.file-info {
    .name {
        word-wrap: break-word;
    }
}
</style>