<script setup lang="ts">
import { ClientSlot } from "../_client";
import ServerSlot from "../_slot.server.vue";
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
