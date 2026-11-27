<script setup lang="ts">
type Guide = { slug: string; title: string; region: string }

const { data } = await useUtpost<{ guides: Guide[] }>('guides', '{ guides { slug title region } }')

useHead({ title: 'Guider – Utpost' })
</script>

<template>
  <h1>Guider</h1>
  <ul>
    <li v-for="guide in data?.guides" :key="guide.slug">
      <NuxtLink :to="`/guider/${guide.slug}`">{{ guide.title }}</NuxtLink>
      <span class="muted"> {{ guide.region }}</span>
    </li>
  </ul>
</template>
