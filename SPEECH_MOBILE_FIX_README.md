# Admi speech + mobile repair v2

This update is for the existing ChatAdmission repository after the Vercel Env Fix.
Unzip at the repository ROOT. Keep existing index.html, api/chat.js, api/translate.js, api/config.js, scripts/vercel-env-bridge.txt, server/common.cjs, package.json and vercel.json.
Replace api/speech.js and scripts/prepare.cjs. Add scripts/speech-mobile-bridge.txt and scripts/mobile-fix.css. Redeploy.
The build retains the original HTML and injects the speech repair AFTER the old environment bridge. This deliberately overrides the old unconditional speech error.

## Authentication (NOT removed)
Path A: Set ADMI_SITE_ACCESS_CODE in Vercel; redeploy; enter the SAME code in the existing Website connection settings. Chat, translation and speech can all use it. The browser calls /api/speech with that code; Google credentials never leave the server.
Path B: Keep the existing ADMI_SPEECH_ACCESS_TOKEN (>=32 characters) and enter it with your speech Backend Base URL in personal speech settings. The two paths coexist.
Do not paste GOOGLE_SERVICE_ACCOUNT_JSON into the web page. Speech does not become public merely by installing this update. If neither access method is configured/provided, speech returns 401 with clear instructions.
School platform google-speech tool can continue using ADMI_SPEECH_ACCESS_TOKEN as a server-injected Bearer credential.

## Google configuration
GOOGLE_SERVICE_ACCOUNT_JSON: full JSON with client_email, private_key and project_id.
GOOGLE_CLOUD_PROJECT: optional if project_id exists in the JSON.
Cloud Text-to-Speech and Speech-to-Text APIs plus billing and appropriate IAM permissions must be enabled.
GOOGLE_STT_LOCATION / GOOGLE_STT_MODEL remain configurable; defaults global / short are retained, NOT asserted to support every language.
GOOGLE_STT_ALLOWED_LANGUAGES controls app validation only; actual model/location support must also match. en-US is a useful first diagnostic case, not proof that other codes work.
The audio is browser MediaRecorder output and the backend uses STT v2 autoDecodingConfig. Container/codec support varies; mobile Safari and Chrome must be tested separately.

## Diagnose
GET /api/speech returns version admi-speech-mobile-2 and configuration flags without secrets, no Google API call.
In the speech panel, Diagnose speech displays these flags; Load voices actually tests auth + TTS voice access. Read aloud auto-loads voices if needed.
Error messages now distinguish backend_access, google_auth, tts_voices, tts_synthesize and stt_recognize; limited provider error details are sanitized. Never paste private keys into support messages.
On iPhone, the browser may require pressing Play on the audio player even after synthesis succeeds. The speech panel is opened automatically so the player is visible.

## Mobile
Header actions use one horizontally scrollable row instead of many wrapped rows.
Translation tools are collapsed into a details panel on phones. Both prompt rows become one horizontal strip; no questions removed.
Input fonts are 16px and safe-area padding is included. VisualViewport height adapts to the keyboard without disabling pinch zoom.
Speech panel stays collapsible. The CSS is a targeted layout repair, not a claim of real-device testing. Test 360/390/430px screens, landscape, keyboard and iOS safe areas.

## Cost/security
Site/speech access protection remains enabled. The in-memory rate limiter is best-effort, not a distributed protection. Use login, durable rate limits and provider billing limits for public deployment.
Requests already sent to Google may incur charges even if playback is stopped. No browser/native TTS fallback is silently substituted for Google Cloud.
Original admission data has not been re-verified.
This ZIP does not push to GitHub or redeploy your site automatically.
