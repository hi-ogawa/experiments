<script setup lang="ts">
import ServerSlot from "../_slot.server.vue";
import ClientSlot from "../_slot.vue";
</script>

<template>
  <div>
    <h4>Server SFC</h4>
    <pre>Rendered at {{ new Date() }}</pre>
    <ClientSlot>
      <ServerSlot>
        <ClientSlot>
          <ServerSlot />
        </ClientSlot>
      </ServerSlot>
    </ClientSlot>
  </div>
</template>
