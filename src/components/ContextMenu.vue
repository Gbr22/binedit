<template>
    <div class="menu">
        <div v-for="section in props.menu.sections" class="section">
            <template v-for="item in section.items">
                <button v-if="isMenuAction(item)" class="action" @click="callAction(item)">
                    {{ item.name }}
                </button>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { closeMenu } from '@/contextMenu';
import { isMenuAction, type RootMenu, type SubMenu, type MenuAction } from '@/contextMenu';

const props = defineProps<{
    menu: RootMenu | SubMenu
}>()

function callAction(action: MenuAction){
    closeMenu();
    action.fn();
}
</script>

<style scoped lang="scss">
.menu {
    background-color: var(--menu-background-color);
    border-radius: 9px;
    padding: 0 4px;
    border: 1px solid var(--context-menu-border-color);
}
.section {
    display: flex;
    flex-direction: column;
    gap: 3px;
    border-top: 1px solid var(--context-menu-border-color);
    padding: 4px 0;

    &:first-child {
        border-top: none;
    }
}
.action {
    border: none;
    outline: none;
    border-radius: 6px;
    height: 28px;
    padding: 0 12px;
    background-color: var(--menu-background-color);
    color: var(--menu-foreground-color);
    text-align: left;

    &:hover {
        background-color: color-mix(in srgb, var(--menu-background-color), 7% var(--mixer-foreground));
        color: color-mix(in srgb, var(--menu-foreground-color), 75% var(--mixer-foreground));
    }
}
</style>