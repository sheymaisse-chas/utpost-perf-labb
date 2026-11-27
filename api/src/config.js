// M3: adresserna läses från miljön när den finns (compose sätter dem), annars gäller de gamla
// localhost-värdena.
// M6 (skuld 7): JWT-hemligheten ligger inte i koden – i molnet kommer den från plattformens secret store.
// M8 (A04 Cryptographic Failures / A07, hålsjakten H4): och INGET reservvärde. Förut föll koden tillbaka
// på 'utpost-dev-secret-byt-i-molnet' när JWT_SECRET saknades – samma värde som i .env.example och
// compose.yaml, alltså publikt. Den som läst repot kunde signera en egen token med role: 'editor'.
// Nu vägrar API:et starta utan variabeln (assertJwtSecret nedan, anropas i index.js och boot.js).
// GIT_SHA sätts när imagen byggs (api/Dockerfile) och syns i /api/health – så ser man vilken commit som kör.
// M7 (skuld 8): bildbearbetningen är en funktion (functions/). Lokalt kör den med func start på 7071 och
// kräver ingen nyckel. I molnet: funktionens URL som variabel och funktionsnyckeln som secret.
// M9 (skuld 10): redaktionens innehåll hämtas från ett headless CMS (cms/contentful.js). Space-id:t är
// ingen hemlighet, de två nycklarna är det. Saknas de är CMS:et avstängt och appen kör utan notiser.
export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://utpost:utpost@localhost:5433/utpost',
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://utpost:utpost@localhost:27017/utpost?authSource=admin',
  jwtSecret: process.env.JWT_SECRET,
  gitSha: process.env.GIT_SHA ?? 'dev',
  port: Number(process.env.PORT ?? 4000),
  imageFunctionUrl: process.env.IMAGE_FUNCTION_URL ?? 'http://localhost:7071/api/process-image',
  imageFunctionKey: process.env.IMAGE_FUNCTION_KEY ?? '',
  cmsSpaceId: process.env.CONTENTFUL_SPACE_ID ?? '',
  cmsEnvironment: process.env.CONTENTFUL_ENVIRONMENT ?? 'master',
  cmsDeliveryToken: process.env.CONTENTFUL_DELIVERY_TOKEN ?? '',
  cmsPreviewToken: process.env.CONTENTFUL_PREVIEW_TOKEN ?? '',
  cmsCacheSeconds: Number(process.env.CMS_CACHE_SECONDS ?? 60),
  // Fredagens labb: hemligheten som CMS:et skickar med när det anropar /api/cms/webhook. Tom = webhooken är stängd.
  cmsWebhookSecret: process.env.CMS_WEBHOOK_SECRET ?? '',
  uploadDir: './uploads',
};

// En hemlighet som går att gissa är ingen hemlighet: kräv den, och kräv att den är lång.
export const assertJwtSecret = () => {
  const secret = config.jwtSecret ?? '';
  if (secret.length < 32 || secret === 'utpost-dev-secret-byt-i-molnet') {
    console.error('JWT_SECRET saknas eller är för kort (minst 32 tecken) – API:et startar inte. Generera: openssl rand -hex 32');
    process.exit(1);
  }
};
