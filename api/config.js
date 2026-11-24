const {send,getEnv}=require('../server/common.cjs');
module.exports=function(req,res){if(req.method!=='GET')return send(res,405,{code:'method_not_allowed'});const e=getEnv();return send(res,200,{version:'admi-vercel-env-1',chatConfigured:!!(e.fastBase&&e.fastKey),translationConfigured:!!e.googleKey,accessCodeRequired:!!e.siteCode});};
