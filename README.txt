Admi_DynamicLanguages — original interface, 3 connection modes

This is an in-place revision of the user-provided Admi_DynamicLanguages.html.
All original PRESET_ANSWERS, UI data and FAQ definitions were preserved byte-for-byte.
Admission content has NOT been re-verified. The preset badge now says not re-verified.
The final HTML contains its own changes directly; no patch script or CDN is required.

LOCAL / SCHOOL:
Use Admi_DynamicLanguages_ThreeModes.html directly (or the ZIP index.html).
Automatic initial mode:
- project-(cmi|emi|demo)-NN.aidcec-ai-agent.com => platform proxy
- file://, localhost, 127.0.0.1, ::1 => local personal keys
- other hosts => same-origin website backend (Vercel-compatible)
Settings > Connection mode lets you explicitly switch mode. Switching clears personal
keys, the site access code and current chat. Mode selection is not saved on reload.
Local personal-key mode is deliberately unavailable on a public hostname.
On an unrecognized school hostname choose platform mode manually.

School paths retained from original:
/fastgpt/v1/chat/completions
/ext/v1/translate/v2
/ext/v1/translate/v2/languages
No front-end Authorization or provider key is attached in platform mode.
Actual school proxy routes and server-side tool keys must match those paths.

Local mode retains separate FastGPT / Google Base URL + key + optional App ID.
Keys remain in memory only, not localStorage. Google key is sent only to the configured
Google service via query parameters; the browser may still enforce CORS/key restrictions.
Tests can incur costs. No automatic retries.

VERCEL:
Replace ROOT index.html with ZIP index.html, and replace vercel.json / package.json.
Keep existing api/chat.js, api/translate.js, api/config.js, server/common.cjs.
The HTML expects the existing chat route to return {text: ...}; Google routes use
{data:{translations:[...]}} and {data:{languages:[...]}} as in this repository.
No backend or environment variable is created by the HTML itself.
Set Framework Preset Other; clear old Build Command overrides; Output Directory '.'.
This deployment is static, with existing API functions. No scripts/prepare.cjs.
An existing .vercelignore excluding old scripts/public/speech is fine; no change needed.
The included api/speech.js disables a legacy speech endpoint if that file is still deployed.
If already excluded by .vercelignore the disabled endpoint simply will not be deployed.
Old scripts/ and public/ can be removed later; they are not dependencies of this version.

Website endpoints: /api/chat, /api/translate, /api/config.
Required server-side variables stay FASTGPT_BASE_URL, FASTGPT_API_KEY,
GOOGLE_TRANSLATE_API_KEY; optional FASTGPT_APP_ID, GOOGLE_TRANSLATE_BASE_URL,
ADMI_SITE_ACCESS_CODE (the existing backend may accept GOOGLE_TRANSLATION aliases).
Apply the site access code in settings if your backend requires one. It is not an API key.
A /api/config success checks settings only, not provider authentication.

Markdown changes:
Links in ordinary model Markdown are no longer stripped by interpretReply.
Structured JSON user_response remains supported. Links within structured points work too.
Safe DOM rendering supports headings, lists, bold, emphasis, code blocks, blockquotes,
basic tables and links. HTTP(S)/mailto allowed; raw HTML does not execute.
Not a full CommonMark parser. Existing official-source link buttons open in a new tab.

Mobile changes are embedded in the HTML, keeping the original layout: one-row header
controls, horizontal quick prompts, collapsible language tools and visual viewport sizing.
Actual phone testing and live FastGPT/Google/school proxy verification still required.
The original native SpeechRecognition feature and mic UI have been removed.
No public shared-key app should rely on per-instance rate limits alone; use access
control and provider quotas. Do not place provider/service-account keys in source files.

Tests: JS syntax; no missing static DOM IDs; original data hash preservation; server,
platform and localhost request-shape mocks; safe Markdown link/table tests. No live keys.
This package does NOT modify GitHub or deploy Vercel automatically.
