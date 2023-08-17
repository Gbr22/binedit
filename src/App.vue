<script setup lang="ts">
import Editor from './components/Editor.vue';
import Menu from './components/Menu.vue';
import FileInfo from './components/FileInfo.vue';
</script>

<template>
  <Menu />
  <main>
    <FileInfo />
    <Editor />
  </main>
</template>

<style scoped lang="scss">
main {
  display: grid;
  grid-template-columns: 300px 1fr;
}
</style>
