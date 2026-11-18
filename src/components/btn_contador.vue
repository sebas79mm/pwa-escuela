<script setup>
  import { ref } from 'vue';

  const contador = ref(0);
</script>

<template>
    <div class="contador">
        <button @click="contador++">Click me</button>
            Haz hecho click {{ contador }} veces
    </div>
</template>

<style scoped>
  .contador {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
  }

  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }

  p {
    margin-top: 10px;
    font-size: 18px;
  }
</style>