<script setup lang="ts">
import { ref } from "vue";
const count = ref<number>(0);
</script>

<template>
  <button class="client-btn" @click="count++">
    client sfc: {{ count }}
  </button>
</template>
