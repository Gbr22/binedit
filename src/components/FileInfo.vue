<template>
    <div class="file-info data-table" v-if="state.currentFile">
        <div>File name</div>
        <div class="name">
            {{ state.currentFile.name }}
        </div>
        <div>File size</div>
        <div>
            {{ formatNumber(state.currentFile.file.size) }} bytes
            ({{ formatUnit(state.currentFile.file.size) }})
        </div>
    </div>
</template>

<script setup lang="ts">
import { state } from '@/state';

function formatNumber(n: number){
    const float = n - Math.floor(n);
    const digits = Math.floor(n).toString().split('').reverse();
    let str = "";
    while (digits.length > 3){
        let [a, b, c, ...rest] = digits;
        str += `${a}${b}${c},`;
        digits.splice(0,3);
    }
    str += digits.join('');
    return str.split('').reverse().join('');
}

function formatUnit(byteCount: number){
    let power = 0;
    const p = 1024;
    
    while(Math.floor(byteCount / p) > 0){
        byteCount /= p;
        power++;
    }
    const n = byteCount;
    const map = new Map([
        [0, "B"],
        [1, "KiB"],
        [2, "MiB"],
        [3, "GiB"],
        [4, "TiB"],
        [5, "PiB"],
        [6, "EiB"],
        [7, "ZiB"],
        [8, "YiB"],
    ]);
    const unit = map.get(power);
    return `${n.toFixed(1)} ${unit}`;
}
</script>

<style scoped lang="scss">
.file-info {
    .name {
        word-wrap: break-word;
    }
}
</style>