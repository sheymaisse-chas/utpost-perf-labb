// Spik för M10: guidesidorna i Nuxt, mot samma GraphQL-API som Vue-klienten. Inget här deployas –
// spiken finns för att ni ska se skillnaden mellan CSR, SSR och SSG med egna ögon innan ni väljer.
//
// Utpost ska köra (docker compose up) – spiken frågar API:et genom Utposts nginx.
const UTPOST = process.env.UTPOST_URL ?? 'http://localhost:3001'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  app: { head: { htmlAttrs: { lang: 'sv' } } },

  routeRules: {
    // Samma knep som nginx i client-imagen: browsern pratar bara med den här servern, och
    // /graphql och /bilder skickas vidare till Utpost. Ingen CORS, inga adresser i sidorna.
    '/graphql': { proxy: `${UTPOST}/graphql` },
    '/bilder/**': { proxy: `${UTPOST}/bilder/**` },

    // RENDERINGSVALET, per adress. Utan regel gäller SSR: servern kör Vue för varje besök.
    // Prova en rad i taget, bygg om (npm run build) och fråga med curl vad som kommer tillbaka:
    // '/guider/**': { ssr: false }, // CSR – som Utpost i dag: tom HTML, allt ritas i browsern
    // '/guider/**': { swr: 60 },    // SSR med cache: servern ritar, svaret återanvänds i 60 s
    //
    // SSG behöver ingen regel: npm run generate bygger varje sida som går att nå via en länk
    // till en färdig fil i .output/public/ – en gång, när appen byggs.
  },
})
