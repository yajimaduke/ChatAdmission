const {send,getEnv,guard,chatUrl,body,upstream,fail}=require('../server/common.cjs');
module.exports=async function(req,res){
 if(!guard(req,res,['POST']))return;
 try{
  const env=getEnv();if(!env.fastBase||!env.fastKey)return send(res,503,{code:'fastgpt_env_missing',missing:[...(!env.fastBase?['FASTGPT_BASE_URL']:[]),...(!env.fastKey?['FASTGPT_API_KEY']:[])]});
  const b=body(req);
  if(!Array.isArray(b.messages)||!b.messages.length||b.messages.length>20)return send(res,400,{code:'invalid_messages'});
  const messages=b.messages.map(m=>{
   if(!m||!['user','assistant','system'].includes(m.role)||typeof m.content!=='string'||m.content.length>18000)throw Object.assign(new Error('Invalid message'),{status:400,code:'invalid_message'});
   return {role:m.role,content:m.content};
  });
  if(messages.reduce((n,m)=>n+m.content.length,0)>40000)return send(res,400,{code:'messages_too_long'});
  const payload={messages:messages.slice(-13),max_tokens:600,stream:false,detail:false,variables:{responseLanguage:typeof b.language==='string'?b.language.slice(0,100):'English'}};
  if(env.fastApp)payload.appId=env.fastApp;
  const data=await upstream(chatUrl(env.fastBase),{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.fastKey},body:JSON.stringify(payload)});
  const content=data?.choices?.[0]?.message?.content;
  if(typeof content!=='string'&&!Array.isArray(content))return send(res,502,{code:'fastgpt_invalid_response'});
  const text=Array.isArray(content)?content.map(x=>x?.text||'').join(''):content;
  return send(res,200,{text});
 }catch(e){return fail(res,e);}
};
