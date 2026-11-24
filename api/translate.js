const {send,getEnv,guard,translationRoot,body,upstream,fail}=require('../server/common.cjs');
module.exports=async function(req,res){
 if(!guard(req,res,['GET','POST']))return;
 try{
  const env=getEnv();if(!env.googleKey)return send(res,503,{code:'google_translation_env_missing'});
  const root=translationRoot(env.googleBase);
  if(req.method==='GET'){
   const target=typeof req.query?.target==='string'?req.query.target:'zh-TW';
   if(!/^[a-zA-Z0-9-]{2,35}$/.test(target))return send(res,400,{code:'invalid_target'});
   const u=new URL(root+'/languages');u.searchParams.set('key',env.googleKey);u.searchParams.set('model','nmt');u.searchParams.set('target',target);
   const d=await upstream(u.href,{method:'GET'});
   if(!Array.isArray(d?.data?.languages))return send(res,502,{code:'invalid_language_response'});
   return send(res,200,{data:{languages:d.data.languages.map(x=>({language:x.language,...(x.name?{name:x.name}:{})}))}});
  }
  const b=body(req),q=typeof b.q==='string'?[b.q]:b.q;
  if(!Array.isArray(q)||!q.length||q.length>100||q.some(x=>typeof x!=='string')||Buffer.byteLength(q.join(''))>50000)return send(res,400,{code:'invalid_translation_text'});
  if(typeof b.target!=='string'||!/^[a-zA-Z0-9-]{2,35}$/.test(b.target))return send(res,400,{code:'invalid_target'});
  const u=new URL(root);u.searchParams.set('key',env.googleKey);
  const payload={q,target:b.target,format:'text',model:'nmt'};
  if(typeof b.source==='string'&&/^[a-zA-Z0-9-]{2,35}$/.test(b.source))payload.source=b.source;
  const d=await upstream(u.href,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  if(!Array.isArray(d?.data?.translations))return send(res,502,{code:'invalid_translation_response'});
  return send(res,200,{data:{translations:d.data.translations.map(x=>({translatedText:x.translatedText}))}});
 }catch(e){return fail(res,e);}
};
