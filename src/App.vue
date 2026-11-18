<script setup>
  import Cards from './components/cards.vue'
  import { ref } from 'vue'
  const titulo = ref("Mi Titulo")
  function limpiarTitulo() {
    titulo.value = ""
  }
</script>

<template>
  <Cards/>
</template>

