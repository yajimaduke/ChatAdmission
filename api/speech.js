module.exports=function(req,res){
 res.setHeader('Cache-Control','no-store');
 return res.status(410).json({code:'speech_removed',message:'TTS and STT are disabled. This endpoint does not call Google or read speech credentials.'});
};
