<template>
    <div class="file-info" v-if="state.currentFile">
        <div>
            File name: {{ state.currentFile.name }}
        </div>
        <div>
            File size:
            {{ formatNumber(state.currentFile.buffer.byteLength) }} bytes
            ({{ formatUnit(state.currentFile.buffer.byteLength) }})
        </div>
    </div>
</template>

<script setup lang="ts">
import { state } from '@/state';

function formatNumber(n: number){
    const float = n - (n|0);
    const digits = (n|0).toString().split('').reverse();
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
    
    while(Math.floor(byteCount / 1024) > 0){
        byteCount /= 1024;
        power++;
    }
    const n = byteCount|0;
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
    return `${n} ${unit}`;
}
</script>

<style scoped lang="scss">
.file-info {
    font-size: 14px;
}
</style>