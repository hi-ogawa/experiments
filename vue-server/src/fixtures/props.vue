<script setup>
import { defineProps } from "vue";
const props = defineProps({
	message: {
		type: String,
		required: true,
	},
});
</script>

<template>
  <div id="props">{{ props.message }}</div>
</template>
