<template>
    <div class="menu">
        <button @click="openAction.fn()" class="button">
            Open
        </button>
        <button @click="newAction.fn()" class="button">
            New
        </button>
    </div>
</template>

<script setup lang="ts">
import { openAction } from "../actions/open";
import { newAction } from "../actions/new";

</script>

<style scoped lang="scss">
.menu {
    background-color: #1F1F1F;
    padding: 5px;
    display: flex;
    flex-direction: row;
    gap: 2px;
}
.button {
    font-size: 13px;
    border: none;
    height: 25px;
    padding: 0 8px;
    border-radius: 6px;
    color: #dedede;

    background-color: transparent;

    &:focus, &:hover {
        background-color: #2D2E2E;
        color: #f0f0f0;
    }
}
</style>