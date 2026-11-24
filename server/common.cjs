const buckets = new Map();
const crypto = require('node:crypto');
function send(res, status, body) { res.setHeader('Cache-Control','no-store'); return res.status(status).json(body); }
function same(a,b) { const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y); }
function getEnv() {
 return {
  fastBase: process.env.FASTGPT_BASE_URL || '',
  fastKey: process.env.FASTGPT_API_KEY || '',
  fastApp: process.env.FASTGPT_APP_ID || '',
  googleBase: process.env.GOOGLE_TRANSLATE_BASE_URL || process.env.GOOGLE_TRANSLATION_BASE_URL || 'https://translation.googleapis.com',
  googleKey: process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATION_API_KEY || '',
  siteCode: process.env.ADMI_SITE_ACCESS_CODE || ''
 };
}
function guard(req,res,methods) {
 if(!methods.includes(req.method)) {send(res,405,{code:'method_not_allowed'});return false;}
 const origin=req.headers.origin;
 const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0];
 const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0];
 if(origin&&origin!==proto+'://'+host){send(res,403,{code:'origin_not_allowed'});return false;}
 const code=getEnv().siteCode;
 if(code&&!same(String(req.headers.authorization||''),'Bearer '+code)){send(res,401,{code:'site_access_code_required'});return false;}
 const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0],now=Date.now(),key=ip+':'+String(req.url||'').split('?')[0];
 if(buckets.size>2000)for(const [k,v]of buckets)if(v.until<now)buckets.delete(k);
 const b=buckets.get(key);
 if(b&&b.until>now&&b.count>=30){send(res,429,{code:'rate_limited'});return false;}
 if(!b||b.until<now)buckets.set(key,{until:now+60000,count:1});else b.count++;
 return true;
}
function base(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Object.assign(new Error('Invalid configured base URL'),{status:503,code:'invalid_server_base_url'});return u.href.replace(/\/+$/,'');}
function chatUrl(value){const b=base(value);if(/\/chat\/completions$/i.test(b))return b;if(/\/(api\/)?v1$/i.test(b))return b+'/chat/completions';return b+(/\/api$/i.test(b)?'/v1/chat/completions':'/api/v1/chat/completions');}
function translationRoot(value){return base(value).replace(/\/language\/translate\/v2(?:\/languages)?$/i,'').replace(/\/language\/translate$/i,'')+'/language/translate/v2';}
function body(req){const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};if(Buffer.byteLength(JSON.stringify(b))>100000)throw Object.assign(new Error('Too large'),{status:413,code:'body_too_large'});return b;}
async function upstream(url,options){const r=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(50000)});const data=await r.json().catch(()=>null);if(!r.ok)throw Object.assign(new Error('Provider rejected request'),{status:r.status,code:'upstream_'+r.status});if(!data)throw Object.assign(new Error('Invalid response'),{status:502,code:'upstream_not_json'});return data;}
function fail(res,e){return send(res,[400,401,402,403,404,413,429,503].includes(e.status)?e.status:502,{code:e.code||'upstream_request_failed'});}
module.exports={send,getEnv,guard,chatUrl,translationRoot,body,upstream,fail};
