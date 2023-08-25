<script setup lang="ts">
import Editor from './components/Editor.vue';
import Menu from './components/Menu.vue';
import FileInfo from './components/FileInfo.vue';
import Tabs from './components/Tabs.vue';
import { state } from './state';
import ContextMenuRoot from './components/ContextMenuRoot.vue';
</script>

<template>
  <Menu />
  <div class="middle">
    <div class="left-menu">
      <FileInfo />
    </div>
    <main v-if="state.tabs.length != 0">
      <Tabs />
      <Editor />
    </main>
  </div>
  <ContextMenuRoot />
</template>

<style scoped lang="scss">
.middle {
  display: grid;
  grid-template-columns: 300px 1fr;
  border-top: 1px solid var(--border-color);
}
main {
  display: grid;
  grid-template-rows: auto 1fr;
}
.left-menu {
  border-right: 1px solid var(--border-color);
}
</style>
