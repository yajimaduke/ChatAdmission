# ChatAdmission Vercel environment-variable fix

This upgrade preserves the existing source index.html and api/speech.js. Add/replace the files in this ZIP at your repository ROOT. Do not create an extra enclosing folder.

At build time, scripts/prepare.cjs checks the existing HTML, fixes its manual-key guard, injects the environment bridge inside its existing JavaScript closure, and writes public/index.html. Source index.html remains untouched. If expected code is not found, the build fails rather than deploying a partial patch.

Files added:
- api/chat.js, api/translate.js, api/config.js
- server/common.cjs
- scripts/prepare.cjs, scripts/vercel-env-bridge.txt
Files replaced: package.json, vercel.json
Keep: existing index.html, api/speech.js, other source files.

Vercel settings: Framework Preset = Other; build command node scripts/prepare.cjs; output directory public. Remove conflicting dashboard overrides if they point elsewhere. Production domain must track this repository/main branch. Redeploy after adding variables.

Required server-only environment variables:
FASTGPT_BASE_URL = your actual FastGPT server URL
FASTGPT_API_KEY = your FastGPT app API key
FASTGPT_APP_ID = optional, only if needed by your app
GOOGLE_TRANSLATE_API_KEY = Google Cloud Translation Basic API key
GOOGLE_TRANSLATE_BASE_URL = optional; defaults to https://translation.googleapis.com
Also accepts GOOGLE_TRANSLATION_API_KEY and GOOGLE_TRANSLATION_BASE_URL as aliases.
Do not prefix secrets with NEXT_PUBLIC_. Do not commit secrets.

Optional access protection:
ADMI_SITE_ACCESS_CODE = a strong shared code. When set, chat and translation require it. Users enter this code in website settings; it is NOT a Google/FastGPT key. When unset these endpoints are public. For a public deployment use proper login/deployment protection and durable rate limits. The included per-instance rate limiter and same-origin checks are NOT sufficient abuse protection. Set provider quotas/billing safeguards before publishing.

Diagnostics:
Open /api/config in the new deployment. Expected version admi-vercel-env-1. It returns ONLY booleans chatConfigured, translationConfigured and accessCodeRequired, never keys.
If /api/config is 404, you deployed the wrong directory/branch or Functions were not deployed.
If booleans are false, check variable names, Production target and redeploy.
Provider failures surface safe error codes, not raw secrets.

Website default: uses /api/chat and /api/translate, without requiring manual provider keys. The language list comes through the same translation backend. Personal keys remain optional overrides; clear them to return to website defaults.
School platform mode and local file mode keep the original behavior.
Speech remains on the previous api/speech.js with its existing Google service-account/access-token setup. This upgrade does not remove its access controls or merge them with chat credentials.
The manual HTML index.html opened directly still uses personal settings. The built public/index.html is the Vercel environment-enabled site.

This ZIP is code only; it has NOT changed your GitHub repository or redeployed Vercel.
