<script setup lang="ts">
import type { Guide } from '@utpost/shared'
import { formatDifficulty } from '../lib/format'

defineProps<{ guide: Guide }>()
</script>

<template>
  <article class="card">
    <img v-if="guide.hero_image" :src="`/bilder/${guide.hero_image}`" alt="" />
    <h3>
      <RouterLink :to="`/guider/${guide.slug}`">{{ guide.title }}</RouterLink>
    </h3>
    <p class="muted">
      {{ guide.region }} · {{ formatDifficulty(guide.difficulty) }} · {{ guide.length_km }} km
    </p>
  </article>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 4px;
}
.card img {
  width: 100%;
  border-radius: 4px;
}
.muted {
  color: #777;
  font-size: 14px;
}
</style>
