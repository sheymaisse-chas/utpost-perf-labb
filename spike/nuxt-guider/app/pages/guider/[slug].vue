<script setup lang="ts">
type Guide = {
  title: string
  region: string
  difficulty: string
  lengthKm: number
  heroImage: string | null
  bodyHtml: string
}

// Filens plats ÄR routen: pages/guider/[slug].vue svarar på /guider/<vad som helst>.
const route = useRoute()
const slug = route.params.slug as string

const { data } = await useUtpost<{ guide: Guide | null }>(
  `guide-${slug}`,
  `query Guide($slug: String!) {
    guide(slug: $slug) { title region difficulty lengthKm heroImage bodyHtml }
  }`,
  { slug },
)

// Servern vet om guiden finns innan den svarar – en guide som inte finns blir en riktig 404,
// inte en 200 med texten "finns inte" som i en SPA.
if (!data.value?.guide) {
  throw createError({ statusCode: 404, statusMessage: 'Det finns ingen guide som heter så', fatal: true })
}
const guide = data.value.guide

// Titeln sätts på servern och står i HTML:en – det en sökmotor eller en delad länk läser.
useHead({ title: `${guide.title} – Utpost` })
</script>

<template>
  <article>
    <!-- Bilden står i HTML:en från första byten: browsern börjar hämta den innan något JavaScript har körts. -->
    <img
      v-if="guide.heroImage"
      :src="`/bilder/${guide.heroImage}`"
      width="2400"
      height="1600"
      alt=""
      fetchpriority="high"
    />
    <h1>{{ guide.title }}</h1>
    <p class="muted">{{ guide.region }} · {{ guide.difficulty }} · {{ guide.lengthKm }} km</p>
    <!-- Redaktionens HTML, sanerad av API:et (M8). Era guider kommer ur CMS:et (M9) – visa dem som ni gör i klienten. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="guide.bodyHtml"></div>
  </article>
</template>
