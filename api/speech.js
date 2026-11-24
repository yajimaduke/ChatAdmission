const crypto = require('node:crypto');
let tokenCache = null;
const buckets = new Map();
const json = (res, status, body) => res.status(status).json(body);
function constantEqual(a, b) { const x = Buffer.from(a || ''), y = Buffer.from(b || ''); return x.length === y.length && crypto.timingSafeEqual(x, y); }
async function googleToken(credentials) {
  if (tokenCache && tokenCache.expires > Date.now() + 60000) return tokenCache.value;
  const now = Math.floor(Date.now() / 1000);
  const encode = x => Buffer.from(JSON.stringify(x)).toString('base64url');
  const unsigned = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({ iss: credentials.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), credentials.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + signature }), signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw Object.assign(new Error('Google authentication failed'), { status: 502, code: 'google_auth_failed' });
  tokenCache = { value: data.access_token, expires: Date.now() + Math.min(Number(data.expires_in) || 3600, 3600) * 1000 };
  return tokenCache.value;
}
async function callGoogle(url, method, body, token) {
  const r = await fetch(url, { method, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(55000) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('Google rejected the request'), { status: r.status, code: String(data.error?.status || 'google_error').slice(0, 60) });
  return data;
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const origin = req.headers.origin;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const sameOrigin = protocol + '://' + host;
  const allowed = (process.env.ADMI_ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  if (origin && origin !== sameOrigin && !allowed.includes(origin)) return json(res, 403, { code: 'origin_not_allowed' });
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { code: 'method_not_allowed' });
  const access = process.env.ADMI_SPEECH_ACCESS_TOKEN || '';
  if (access.length < 32) return json(res, 503, { code: 'backend_access_token_not_configured' });
  if (!constantEqual(String(req.headers.authorization || ''), 'Bearer ' + access)) return json(res, 401, { code: 'backend_access_denied' });
  // Best effort per-instance limiter; use durable rate limits/identity for public deployments.
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0];
  const now = Date.now();
  if (buckets.size > 2000) for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const bucket = buckets.get(ip);
  if (bucket && bucket.until > now && bucket.count >= 15) return json(res, 429, { code: 'rate_limited' });
  if (!bucket || bucket.until < now) buckets.set(ip, { until: now + 60000, count: 1 }); else bucket.count++;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (Buffer.byteLength(JSON.stringify(body)) > 400000) return json(res, 413, { code: 'body_too_large' });
    if (!['voices', 'speak', 'transcribe'].includes(body.op)) return json(res, 400, { code: 'invalid_operation' });
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
    if (!credentials.client_email || !credentials.private_key) return json(res, 503, { code: 'google_credentials_missing' });
    const token = await googleToken(credentials);
    if (body.op === 'voices') {
      const data = await callGoogle('https://texttospeech.googleapis.com/v1/voices', 'GET', null, token);
      const voices = (data.voices || []).filter(v => Array.isArray(v.languageCodes) && /-(Standard|Wavenet|Neural2)-/.test(v.name || ''));
      return json(res, 200, { voices });
    }
    if (body.op === 'speak') {
      if (typeof body.text !== 'string' || !body.text.trim() || Buffer.byteLength(body.text) > 4500) return json(res, 400, { code: 'invalid_text_length' });
      if (typeof body.voiceName !== 'string' || !/^[a-zA-Z0-9-]{3,120}$/.test(body.voiceName) || !/-(Standard|Wavenet|Neural2)-/.test(body.voiceName)) return json(res, 400, { code: 'invalid_voice' });
      if (typeof body.languageCode !== 'string' || !/^[A-Za-z0-9-]{2,35}$/.test(body.languageCode)) return json(res, 400, { code: 'invalid_language' });
      const data = await callGoogle('https://texttospeech.googleapis.com/v1/text:synthesize', 'POST', { input: { text: body.text }, voice: { languageCode: body.languageCode, name: body.voiceName }, audioConfig: { audioEncoding: 'MP3' } }, token);
      return json(res, 200, { audioContent: data.audioContent });
    }
    if (typeof body.audioContent !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.audioContent) || body.audioContent.length > 350000) return json(res, 400, { code: 'invalid_or_large_audio' });
    const permitted = (process.env.GOOGLE_STT_ALLOWED_LANGUAGES || 'en-US,en-GB,yue-Hant-HK,cmn-Hant-TW,cmn-Hans-CN,ja-JP,ko-KR').split(',').map(x => x.trim());
    if (!permitted.includes(body.languageCode)) return json(res, 400, { code: 'stt_language_not_allowed' });
    const project = process.env.GOOGLE_CLOUD_PROJECT || credentials.project_id;
    const location = process.env.GOOGLE_STT_LOCATION || 'global';
    const model = process.env.GOOGLE_STT_MODEL || 'short';
    if (!project || !/^[a-zA-Z0-9:-]+$/.test(project) || !/^[a-z0-9-]+$/.test(location) || !/^[a-zA-Z0-9_-]+$/.test(model)) return json(res, 503, { code: 'invalid_stt_configuration' });
    const apiHost = location === 'global' ? 'speech.googleapis.com' : location + '-speech.googleapis.com';
    const url = 'https://' + apiHost + '/v2/projects/' + project + '/locations/' + location + '/recognizers/_:recognize';
    const data = await callGoogle(url, 'POST', { config: { autoDecodingConfig: {}, languageCodes: [body.languageCode], model }, content: body.audioContent }, token);
    return json(res, 200, { transcript: (data.results || []).map(r => r.alternatives?.[0]?.transcript || '').filter(Boolean).join('\n') });
  } catch (error) {
    // Do not return Google tokens, credential contents or raw provider error bodies.
    return json(res, [400,401,402,403,404,413,429].includes(error.status) ? error.status : 502, { code: error.code || 'speech_backend_failed' });
  }
};
