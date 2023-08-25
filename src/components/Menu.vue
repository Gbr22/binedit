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
    background-color: var(--menu-background-color);
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
    color: var(--menu-foreground-color);

    background-color: transparent;

    &:focus, &:hover {
        background-color: color-mix(in srgb, var(--menu-background-color), 7% var(--mixer-foreground));
        color: color-mix(in srgb, var(--menu-foreground-color), 75% var(--mixer-foreground));
    }
}
</style>