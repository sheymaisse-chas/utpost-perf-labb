<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@urql/vue'
import { graphql } from '../gql'
import { useAuthStore } from '../stores/auth'
import NoticeList from '../components/NoticeList.vue'
import { formatDifficulty } from '../lib/format'

// Startsidan: EN fråga som ber om exakt de fält mallen nedan visar (skuld 6).
// M5: frågan skrivs i graphql(`…`) så att codegen ser den. Typen på svaret genereras ur schemat –
// ta bort ett fält ur frågan, och mallen som använder det blir ett typfel i npm run typecheck.
const HomeDocument = graphql(/* GraphQL */ `
  query Home($preview: Boolean) {
    notices(preview: $preview) {
      id
      title
      level
      status
      guideSlug
      body {
        runs {
          text
          bold
          italic
          href
        }
      }
    }
    guides {
      slug
      title
      region
      difficulty
      lengthKm
      bodyHtml
      heroImage
    }
    popularGuides(limit: 6) {
      slug
      title
      region
      heroImage
    }
    regions
    tours(limit: 5) {
      id
      title
      distanceM
    }
  }
`)

// useQuery kör frågan när vyn skapas och ger tre refs: data, fetching och error.
// Andra gången vyn visas svarar cachen (urql.ts) – inget nätverksanrop.
//
// M9: notiserna ligger i samma fråga – för klienten är de bara ett fält till, fast de kommer ur
// CMS:et. Redaktören kan slå på förhandsgranskningen: då skickas preview: true, API:et kontrollerar
// rollen och svarar med utkasten också. I det läget hämtas alltid färskt, aldrig ur cachen.
const auth = useAuthStore()
const isEditor = computed(() => auth.user?.role === 'editor')
const showDrafts = ref(false)
const preview = computed(() => isEditor.value && showDrafts.value)
const variables = computed(() => ({ preview: preview.value }))
const requestPolicy = computed(() => (preview.value ? 'network-only' : 'cache-first'))
const { data, fetching, error } = useQuery({ query: HomeDocument, variables, requestPolicy })
</script>

<template>
  <!-- M10: bilden är sidans största element (LCP) och behöver inga data – den står utanför
       v-if-kedjan, så browsern får veta om den direkt och inte först när API:et har svarat.
       width/height ger proportionerna, så platsen är reserverad innan bilden kommit.
       fetchpriority="high": den här bilden före allt annat. Aldrig loading="lazy" på LCP-bilden. -->
  <section class="hero">
    <img
      class="hero-img"
      src="/bilder/start.webp"
      width="1200"
      height="600"
      alt=""
      fetchpriority="high"
    />
    <h1>Hitta din nästa tur</h1>
    <p v-if="data">{{ data.guides.length }} guider i {{ data.regions.length }} landskap.</p>
  </section>

  <p v-if="error" role="alert">Kunde inte hämta startsidan: {{ error.message }}</p>
  <p v-else-if="fetching || !data">Laddar…</p>
  <div v-else>
    <label v-if="isEditor" class="muted">
      <input v-model="showDrafts" type="checkbox" /> Förhandsgranska: visa utkast
    </label>
    <NoticeList :notices="data.notices" />

    <h2>Populärast just nu</h2>
    <ul class="cards">
      <li v-for="g in data.popularGuides" :key="g.slug">
        <img v-if="g.heroImage" :src="`/bilder/${g.heroImage}`" alt="" />
        <RouterLink :to="`/guider/${g.slug}`">{{ g.title }}</RouterLink>
        <span class="muted"> {{ g.region }}</span>
      </li>
    </ul>

    <h2>Senaste turerna</h2>
    <ul class="list">
      <li v-for="t in data.tours" :key="t.id">
        <RouterLink :to="`/turer/${t.id}`">{{ t.title }}</RouterLink>
        <span class="muted"> {{ Math.round(t.distanceM / 100) / 10 }} km</span>
      </li>
    </ul>

    <h2>Alla guider</h2>
    <ul class="list">
      <li v-for="g in data.guides" :key="g.slug">
        <RouterLink :to="`/guider/${g.slug}`">{{ g.title }}</RouterLink>
        <span class="muted">
          {{ g.region }} · {{ formatDifficulty(g.difficulty) }} · {{ g.lengthKm }} km</span
        >
      </li>
    </ul>
  </div>
</template>

<style scoped>
.hero {
  padding: 24px 0;
}
.hero-img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  margin-bottom: 12px;
}
.cards {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.cards img {
  width: 100%;
  border-radius: 4px;
  display: block;
}
.list {
  padding-left: 18px;
}
.muted {
  color: #777;
  font-size: 14px;
}
</style>
