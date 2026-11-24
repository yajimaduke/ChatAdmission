Admi complete source HTML — text-only edition

FILES TO REPLACE AT REPOSITORY ROOT:
index.html
vercel.json
package.json
.vercelignore (hidden filename; upload this too)

KEEP your existing api/chat.js, api/translate.js, api/config.js and server/common.cjs.
The new HTML calls those existing backends. No real keys are included.

The root index.html IS the final page: CSS, robot SVG builder, mobile viewport handling,
Markdown/link renderer, chat, translation and settings are all in this one file.
There is no build-time patching. vercel.json sets no build command and output directory '.'.
In Vercel choose Framework Preset Other. Remove stale Dashboard Build Command/Output
Directory overrides that still invoke scripts/prepare.cjs or point to public.
Production should track your updated main branch; redeploy after replacing files.

The .vercelignore file excludes the old public directory, patch scripts and speech API
from a new source deployment. If Vercel reports a stale function pattern, ensure the new
vercel.json is the one deployed. A clean repository can also delete old scripts/, public/
and api/speech.js; this is optional cleanup, not a dependency of the new HTML.
No speech function or speech UI is present in the new index.html.

Required existing environment variables remain:
FASTGPT_BASE_URL
FASTGPT_API_KEY
FASTGPT_APP_ID (optional)
GOOGLE_TRANSLATE_API_KEY
GOOGLE_TRANSLATE_BASE_URL (optional)
ADMI_SITE_ACCESS_CODE (optional)

Settings support server defaults, personal direct HTTPS APIs (keys in memory only),
and explicitly configured school proxy routes. Platform paths must match the actual host.
Local file opening displays the UI but cannot provide same-origin server endpoints;
configure personal APIs or use your deployed website.

Supported Markdown subset: headings, paragraphs, line breaks, bold, emphasis, lists,
blockquotes, fenced code, basic pipe tables, HTTP(S)/mailto links and bare HTTP(S) URLs.
Raw HTML is text, not executable markup. No external Markdown library/CDN required.
Not a complete CommonMark implementation; nested lists/complex tables are not guaranteed.
Per-answer translation preserves existing link destinations and code blocks.
Translation language choices do not imply speech capabilities (no voice features).

This is a refreshed/rebuilt text interface. It does not reproduce the old hard-coded
admission FAQ answers: the 10 question-topic buttons send questions to FastGPT.
No admission dates, fees or eligibility claims were re-verified or hard-coded.
Copy/export retain original model text; translation is a display-only action.

Deployment is NOT performed automatically by receiving this ZIP. No GitHub changes made.
No real FastGPT/Google keys or real-device browser tests were used during preparation.
Public shared-key sites need access controls, durable rate limiting and provider budget caps.
