<script setup lang="ts">
import Editor from './components/Editor.vue';
import Menu from './components/Menu.vue';
import FileInfo from './components/FileInfo.vue';
import Tabs from './components/Tabs.vue';
</script>

<template>
  <Menu />
  <div class="middle">
    <div class="left-menu">
      <FileInfo />
    </div>
    <main>
      <Tabs />
      <Editor />
    </main>
  </div>
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
