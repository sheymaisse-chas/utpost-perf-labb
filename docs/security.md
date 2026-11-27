# Säkerhet – Utpost

*Exempelifyllt facit för mallrepot (M8). Byt ut exempelraderna mot era egna fynd. Minst tre rader ska ha ett riktigt fynd, en fix i en PR och ett test som var rött före fixen. "Gäller inte oss, för …" är också ett svar – men bara om det är sant. Listan följer OWASP Top 10 (2025).*

**Datum:** 2026-11-13
**Hotbilden i en mening:** användarnas turer och bilder, redaktionens guider och kontona – mot skript som provar varje endpoint utan token, gissar lösenord och skickar vad som helst som indata. Angriparen är oftast ett skript, inte en person.

## Autentiseringen (M8)

- Lösenord: scrypt-hash med salt (`api/src/lib/password.js`, format `scrypt:<salt>:<hash>`), jämförelse med `timingSafeEqual`. Seeden hashar. Klartextraderna (`plaintext:…`) är borta – ett test räknar dem till noll.
- Token: JWT (HS256, `id`, `email`, `role`, 1 h) i `Authorization: Bearer`. I klienten i en variabel i minnet (`client/src/lib/token.ts`), aldrig i `localStorage`. En omladdning loggar ut (känd brist nedan).
- Skyddade routes: `POST /api/tours`, `DELETE /api/tours/:id`, `POST /api/photos` kräver token (`requireUser`, 401) och att turen är din (403); `PUT /api/guides/:id` kräver rollen editor (`requireRole`, 403). `createTour` i GraphQL kräver token (UNAUTHENTICATED). Kontrollen sitter i API:et – klientens guard på `/turer/:id/bild` är UX.

## OWASP Top 10 – genomgång

| # | Risk | Gäller oss? | Vad vi hittade (fil, endpoint) | Vad vi gjorde (PR) | Kontroll (testet som var rött före fixen, eller curl) |
|---|---|---|---|---|---|
| A01 | Broken Access Control | ja | `DELETE /api/tours/:id` utan token tog bort vilken tur som helst; `PUT /api/guides/:id` lät vem som helst skriva om redaktionens guider; `POST /api/photos` tog emot bilder till andras turer | `requireUser` + ägarkontroll mot raden (`tours.js`, `photos.js`), `requireRole('editor')` på guides (PR #M8-1, #M8-5) | `routes.test.js`: *DELETE utan token ger 401 och turen finns kvar*, *en medlem kan inte ta bort någon annans tur (403)*, *PUT /api/guides/:id utan token ger 401*, *en medlem får inte ändra guider* – röda före fixen |
| A02 | Security Misconfiguration | ja | `app.use(cors())` = `Access-Control-Allow-Origin: *`; inga säkerhetsheaders från nginx; `server_tokens` på; `express.json` tog 50 MB; api-imagen körde som root | CORS borttagen (samma origin via nginx/Vite), `client/security-headers.conf` i varje location, `server_tokens off`, 1 MB, `USER node` i `api/Dockerfile` (PR #M8-5) | testet *API:et skickar ingen Access-Control-Allow-Origin*; ZAP baseline (10038, 10021, 10020, 10036 = FAIL i `.zap/rules.tsv`); `curl -I http://localhost:3001/` visar CSP |
| A03 | Software Supply Chain Failures | ja | `npm audit --omit=dev`: 7 sårbarheter i produktionsberoenden (qs, proxy-addr, @graphql-tools/utils, source-map-js, drizzle-orm 0.36 med SQL injection via identifierare) | `npm audit fix` + `drizzle-orm@^0.45` (PR #M8-5); jobbet *Säkerhet* kör `npm audit --audit-level=high` och Trivy på varje PR | jobbet rött på en nedgraderad `express` i en test-PR (labbens steg 3); `npm audit` lokalt: 0 |
| A04 | Cryptographic Failures | ja | lösenord i klartext i `users.password_hash` (`plaintext:hemligt123`) – och hela raden gick ut i login-svaret; token gällde 30 dagar | scrypt med salt (`lib/password.js`), `publicUser()` i svaren, 1 h token, bara HS256 i `jwt.verify` (PR #M8-2) | testerna *svaret innehåller aldrig password_hash* och *lösenordet i databasen är hashat* |
| A05 | Injection | ja | `guides.ts` `/search`: sökordet inklistrat i SQL-strängen (`ilike '%${q}%'`) – ett citattecken gav ett anrop som aldrig svarade | parameter `$1` (PR #M8-3). Alla andra frågor var redan parametriserade (kontrollerat med `git grep pool.query` – varje anrop har en parameterlista) | testet *ett citattecken i sökordet ger 200 och en tom lista* |
| A06 | Insecure Design | delvis | redaktionens HTML lagras och renderas rått (`v-html` i GuideDetailView, skuld 10) | lagas inte i M8: innehållet flyttar till ett CMS i M9. CSP:n (`script-src 'self'`) gör ett skript i den HTML:en verkningslöst under tiden | `curl -I` visar CSP; ZAP 10038 |
| A07 | Authentication Failures | ja | `register` tog vilket lösenord som helst och vilken e-post som helst, två gånger; ingen broms mot gissningar | samma svar och samma tid för fel e-post och fel lösenord, `registerSchema` (minst 8 tecken), e-post unik (409) (PR #M8-2). Broms (rate limit) **inte** byggd – känd brist | testerna *fel lösenord och okänd e-post ger samma svar* och *registrering med för kort lösenord ger 400* |
| A08 | Software or Data Integrity Failures | delvis | pipelinen hämtar actions på rörliga major-taggar (`@v4`) | lämnas: GitHubs egna actions. Trivy/ZAP låsta på exakt version. `package-lock.json` + `npm ci` ger exakt samma beroenden i CI | – |
| A09 | Security Logging & Alerting Failures | delvis | API:et loggade bara `Ohanterat fel: …` utan metod eller adress; 401/403 loggas inte | felhanteraren loggar metod + adress + fel; 401/403 loggas fortfarande inte – känd brist | – |
| A10 | Mishandling of Exceptional Conditions | ja | `process.on('unhandledRejection')` svalde felet: `/api/tours/abc` och sökningen med citattecken hängde tills browsern gav upp | `wrap()` + felhanterare i `app.js`: 400 (validering, trasig JSON), 413, 500 utan detaljer (PR #M8-4) | testerna *ett id som inte är ett tal ger 400* och *trasig JSON ger 400 med ett svar* |

## Validering av indata

`validate(schema)` i `api/src/lib/validate.js` körs före varje route som tar emot en body (`login`, `register`, `createTour`, `photoUpload`, `guideUpdate`) och på sökningens query (`searchSchema`); id i adressen går genom `idParam`. Scheman i `api/src/lib/schemas.js`. Ogiltig indata → `400 { error: 'ogiltig indata', issues: [{ path, message }] }`, aldrig en rad i databasen och aldrig ett anrop till funktionen. Testet *en bild med orimliga mått stoppas med 400 innan något sparas* räknar raderna före och efter.

## Headers vi sätter (nginx)

`client/security-headers.conf`, inkluderad i varje location. `curl -I http://localhost:3001/` (lokalt, compose):

```
______ (klistra in utdraget: content-security-policy, x-content-type-options, x-frame-options, referrer-policy, permissions-policy – och att Server: nginx saknar version)
```

## Skanning i pipelinen

Jobbet *Säkerhet* (`ci.yml`) på varje PR: `npm audit --omit=dev --audit-level=high` (beroenden, SCA) · Trivy `fs` (beroenden ur Trivys databas, hemligheter i repot, Dockerfiles) · Trivy `image` på `utpost-api` (Alpine-paket och Node i imagen) · ZAP baseline mot den körande appen på `localhost:3001` (DAST: headers, serverinfo, cachning). Rött = merge blockeras. Undantag står i `.trivyignore` (DS-0002 för nginx) och `.zap/rules.tsv` (IGNORE-raderna) med motivering. Tid för jobbet på `main`: ______.

## Kända brister (medvetet kvar)

- En omladdning loggar ut: token ligger bara i minnet och det finns ingen refresh-token i httpOnly-cookie (klipp 1). Byggs när inloggningen används på riktigt.
- Ingen broms mot lösenordsgissning (rate limit på `/api/auth/login`). scrypt gör varje försök dyrt, men inte omöjligt.
- 401/403 loggas inte – vi ser inte ett pågående försök.
- Redaktionens HTML renderas med `v-html` (skuld 10) – CSP:n är skyddsnätet tills M9.
- nginx-containern startar som root (`.trivyignore` DS-0002).
- GitHubs actions på `@v4`-taggar, inte sha.
