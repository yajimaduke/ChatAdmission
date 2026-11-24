const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridge=fs.readFileSync(path.join(__dirname,'vercel-env-bridge.txt'),'utf8');
if(!html.includes('admi-vercel-env-1-built')){
 const guard=/if\s*\(\s*!HOSTED\s*&&\s*!fgConfig\s*\)\s*\{/g;
 let changed=0;html=html.replace(guard,()=>{changed++;return 'if (!HOSTED && !fgConfig && !USE_SERVER_API) {';});
 if(changed!==1)throw new Error('Expected exactly one manual-key chat guard; found '+changed+'. Refusing an unsafe partial patch.');
 for(const symbol of ['fastRequest','googleTranslate','loadLanguages','languageRecords','filterLanguages','speechRequest','updateKeyStatus'])if(!html.includes(symbol))throw new Error('Unsupported HTML version; missing '+symbol);
 const marker=/\$\(["']brandMascot["']\)\.innerHTML\s*=/g;
 const matches=[...html.matchAll(marker)];if(matches.length!==1)throw new Error('Expected one Admi initialization marker.');
 const at=matches[0].index;
 html=html.slice(0,at)+'// admi-vercel-env-1-built\n'+bridge+'\n'+html.slice(at);
}
fs.mkdirSync(path.join(root,'public'),{recursive:true});
fs.writeFileSync(path.join(root,'public','index.html'),html);
console.log('Built public/index.html with Vercel environment-variable routing. Source index.html unchanged.');
