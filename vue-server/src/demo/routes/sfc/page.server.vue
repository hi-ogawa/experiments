<script setup>
const { default: ClientSfc } = await import("../_client-sfc.vue");
</script>

<template>
  <div>
    <h4>Server SFC</h4>
    <pre>Rendered at {{ new Date() }}</pre>
    <ClientSfc />
  </div>
</template>
