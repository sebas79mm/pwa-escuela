<script setup>
import Titulo_azul from './titulo_azul.vue';
import Titulo_rosa from './titulo_rosa.vue';
import contador from './btn_contador.vue';
</script>

<template>
  <div class="fondo">
    <Titulo_azul />
    <Titulo_rosa />
    <contador />
    <contador />
  </div>
</template>

<style scoped>
  .fondo {
    background-color: green;
    padding: 20px;
  }
</style>