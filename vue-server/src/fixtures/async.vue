<script setup>
const y = await new Promise((resolve) => setTimeout(() => resolve("hi"), 1));
</script>

<template>
  <div>async: {{ y }}</div>
</template>
