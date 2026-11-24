# Admi Cloud Speech update

## Contents
- index.html: Admi with dynamic translation languages, custom FastGPT/Translation settings, Cloud voices, Read aloud, stop playback, and 15-second recording-to-text.
- api/speech.js: Vercel Node.js speech gateway. No external npm dependencies.

## Important
Enabling Google APIs is not sufficient: configure server-side Google credentials and backend access before testing. This package does not deploy anything automatically.
The HTML does NOT accept a Google service-account private key. Never paste service-account JSON into the browser or commit it to GitHub.
This backend only provides speech; Vercel-hosted chat and translation still need their own server routes. School chat/translation use the existing school proxies; local chat/translation keep their own Base URL/key fields.

## 1. Google Cloud
Enable Cloud Text-to-Speech API and Cloud Speech-to-Text API and billing in the same project.
Create a dedicated service account with least privilege, including speech.recognizers.recognize for STT (Cloud Speech Client role). Grant service usage permission where required. Enable TTS and ensure the account is allowed to consume it. Do not give Owner just to make requests work.
If organizational policy permits, create a service-account JSON credential for this example. Prefer workload identity/short-lived credentials for production; this sample uses server-held service-account JSON and exchanges signed JWTs for short-lived OAuth tokens.

## 2. Vercel setup
Deploy the ZIP contents as a Vercel project (Node.js functions; no build command necessary).
Set these server-only environment variables and redeploy:
- GOOGLE_SERVICE_ACCOUNT_JSON: the entire service-account JSON, as a secret (not public).
- GOOGLE_CLOUD_PROJECT: your Google project ID; falls back to the JSON project_id.
- ADMI_SPEECH_ACCESS_TOKEN: a strong random secret, at least 32 characters; not a Google API key.
- ADMI_ALLOWED_ORIGINS: comma-separated frontend origins allowed to call this backend. For a directly opened local HTML, explicitly include null only if you intend to allow file origins. For local dev, include the exact origin such as http://localhost:3000. For the school proxy, include https://project-emi-06.aidcec-ai-agent.com if its Origin header is forwarded. Same-origin Vercel frontend requests are accepted automatically. This is not authentication; the access token is still required.
- GOOGLE_STT_LOCATION: defaults to global.
- GOOGLE_STT_MODEL: defaults to short.
- GOOGLE_STT_ALLOWED_LANGUAGES: optional comma-separated BCP-47 codes. A language must also be supported by your actual model/location. Changing this list alone does not enable model support.

The code uses Speech-to-Text v2 autoDecodingConfig and an implicit recognizer (_). Verify language/model/location availability, especially Cantonese and Mandarin regional variants. Choose supported values in Google documentation; no claim is made that all suggested codes work with every model.

## 3. Use locally
Open index.html, open API settings, and set Cloud speech Backend Base URL to https://YOUR-PROJECT.vercel.app (root URL, not /api).
Enter ADMI_SPEECH_ACCESS_TOKEN in Backend access token. Do NOT use the Google key here.
Click Apply, close settings, open the Cloud speech panel and click Load voices.
Select a voice; click Read aloud below an Admi response.
For STT, set a supported language code, tick recording consent, click Record, speak, then Stop & transcribe. The result goes into the input box and is NOT automatically sent to FastGPT.
Microphone use requires a supported secure browser context (HTTPS/localhost, and sometimes file:// depending on browser).

## 4. School platform
Keep the existing FastGPT and translate settings.
Add a tool secret named google-speech:
- Base URL: https://YOUR-PROJECT.vercel.app/api/
- Authentication: Authorization: Bearer
- Secret: the SAME ADMI_SPEECH_ACCESS_TOKEN (not service-account JSON).
The HTML calls POST /ext/v1/google-speech/speech; the proxy adds the access token.
The school proxy's 64 KB request limit applies. The HTML rejects serialized speech payloads over 60,000 bytes before upload. Browser compression bitrate is a hint, not a guarantee; shorten recording if rejected.
The school sandbox must also allow microphone access; HTML cannot override iframe permission policy.
Google TTS audio responses can also hit proxy response limits for long text. Use short answers; if needed use the Vercel page.

## Privacy / cost / limitations
- Recording max 15 seconds is an app limit, not a Google quota.
- Only Standard, Wavenet and Neural2 voices are exposed in this first version; not all Google voice families. Prices differ.
- No automatic retry. Stop playback does not cancel a request already billed by Google.
- Text/audio is sent through your backend to Google. This app does not persist audio and does not log raw audio or credentials. Google/platform retention and logging remain governed by their own policies.
- Shared backend access tokens are a simple access control, not full user authentication. Public deployments require real login, durable rate limits, abuse controls and billing safeguards. The included per-instance rate limiter is best-effort and not globally reliable across serverless instances.
- Backend error codes are safe diagnostic summaries; check Google configuration without logging secrets.
- Existing admission facts were retained from the original file and have not been re-verified.
- Syntax/mock checks do not equal a live Google test.
