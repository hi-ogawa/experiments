<script setup>
const v = await new Promise((resolve) => setTimeout(resolve, Math.random().s));
</script>

<template>
  <div style="padding: 0.5rem; border: 1px solid #bbb; background-color: #fdd">
    <div>
      <code>
        server random ({{ Math.random().toString(36).slice(2) }})
      </code>
    </div>
    <slot></slot>
  </div>
</template>
