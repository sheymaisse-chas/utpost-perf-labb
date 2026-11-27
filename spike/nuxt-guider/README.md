# Spik: guidesidorna i Nuxt

En spik är ett experiment man gör för att kunna fatta ett beslut. Den här finns för M10:s renderingsval:
samma guider, samma GraphQL-API, men sidorna ritas på servern (SSR) eller redan vid bygget (SSG) i stället
för i browsern (CSR, som Vue-klienten i `client/`). Inget här deployas, och inget i `client/` beror på det.

Eget npm-paket med egen lockfil, som `functions/`. Kräver Node 22 och att Utpost kör på http://localhost:3001
(`docker compose up -d --build --wait` i repots rot).

```bash
cd spike/nuxt-guider
npm install
npm run build
node .output/server/index.mjs        # SSR: servern på http://localhost:3000
```

Fråga båda apparna om samma guide och jämför vad som kommer tillbaka (byt `<slug>` mot en guide ur listan på startsidan):

```bash
curl -s http://localhost:3001/guider/<slug> | grep -o '<title>.*</title>\|<div id="app">.*</div>'
curl -s http://localhost:3000/guider/<slug> | grep -o '<title>[^<]*</title>\|<h1>[^<]*</h1>\|<img[^>]*>'
```

SSG: `npm run generate` bygger varje guide till en färdig fil i `.output/public/guider/`. API:et måste köra
när ni bygger – det är då sidorna läser sitt innehåll.

Renderingsvalet per adress står i `routeRules` i `nuxt.config.ts`: två rader att prova, en i taget (CSR och SSR med cache). Bygg om efter varje ändring.
