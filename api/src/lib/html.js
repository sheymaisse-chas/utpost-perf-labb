import sanitizeHtml from 'sanitize-html';

// M8 (A05 Injection – XSS, hålsjakten H7): guidens body_html renderas med v-html i klienten
// (GuideDetailView). Det som sparas här körs alltså i varje besökares browser. Förut sparades bodyn
// precis som den kom – <img src=x onerror=…> på en guide och skriptet körde för alla som läste den.
//
// Allowlist, inte blocklist: bara taggarna redaktionen faktiskt använder (se seed.js) får vara kvar,
// alla attribut utom href på länkar tas bort (onerror, onclick, style …), och länkar får bara vara
// http, https eller mailto (inte javascript:). Allt annat försvinner – <script> med innehåll.
// Gör det med ett bibliotek som parsar HTML på riktigt (sanitize-html), aldrig med egna regexar.
// Fredagens CSP (script-src 'self') är det andra lagret: den stoppar inline-skript även om något slinker igenom.
const allowlist = {
  allowedTags: ['h2', 'h3', 'h4', 'p', 'br', 'ul', 'ol', 'li', 'em', 'strong', 'a', 'blockquote'],
  allowedAttributes: { a: ['href'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
};

export const sanitizeGuideHtml = (html) => sanitizeHtml(html, allowlist);
