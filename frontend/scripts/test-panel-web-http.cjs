const {spawn,spawnSync}=require('node:child_process');
const {randomUUID,randomBytes}=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'asespro-http-'));
const key=randomBytes(32).toString('hex'),base='http://127.0.0.1:3097';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3097'],{cwd:path.join(__dirname,'..'),windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PROPERTY_DATA_SOURCE:'panel',PANEL_WEB_DATA_DIR:root,PANEL_WEB_PUBLISH_KEY:key,NEXT_PUBLIC_SITE_URL:base}});
let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
async function call(body){const response=await fetch(base+'/api/panel-web',{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {response,data:await response.json()};}
(async()=>{try{
 let ready=false;for(let n=0;n<80;n++){try{if((await fetch(base+'/api/panel-web')).status===401){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready,output);
 assert.equal((await call()).data.items.length,0);
 const photo=fs.readFileSync(path.join(__dirname,'../../mock-servicios/assets/asespro-original.jpg')).toString('base64');
 const body={action:'publish',id:'web-'+randomUUID(),version:0,reviewed:true,data:{operation:'ALQUILER',type:'Casa',zone:'Zona centro',beds:'2',baths:'1',built:'60',details:'Recientemente reciclada'},area:{lat:-32.82,lng:-56.52,radius:600},phone:'59899715662',photos:[photo]};
 const first=await call(body);assert.equal(first.response.status,200,JSON.stringify(first.data));assert.equal(first.data.item.version,1);
 const url='/propiedad/'+body.id;
 const html=await(await fetch(base+url)).text();assert.ok(html.includes('Coordinar visita'));assert.ok(html.includes('Zona aproximada'));assert.ok(!html.includes('Precio de alquiler'));assert.ok(html.includes(encodeURIComponent(url)));assert.ok(!html.includes('Josema Fernandez'));
 const media=first.data.item.property.photoUrls[0];assert.equal((await fetch(base+media)).status,200);
 const bridge=spawnSync('python',['-'],{cwd:path.join(__dirname,'../..'),windowsHide:true,encoding:'utf8',env:{...process.env,TEST_WEB_KEY:key,TEST_WEB_ID:body.id},input:`import sys,os,tempfile,json
from pathlib import Path
sys.path.insert(0,str(Path('branding/briff-local/herramientas').resolve()))
import web_local
with tempfile.TemporaryDirectory() as folder:
 web_local.STORE=Path(folder)/'test.dpapi'
 result=web_local.configure({'url':'${base}','key':os.environ['TEST_WEB_KEY']})
 assert result['configured'] and 'key' not in result
 assert web_local.STORE.read_bytes() != os.environ['TEST_WEB_KEY'].encode()
 loaded=web_local.handle('load',{'id':os.environ['TEST_WEB_ID']})
 assert loaded['photos'] and loaded['item']['property']['hidePrice']
 print('PASS Python: puente, DPAPI, configuracion y recuperacion de fotos.')
`});assert.equal(bridge.status,0,bridge.stderr);console.log(bridge.stdout.trim());
 assert.equal((await call(body)).response.status,400);
 body.version=1;body.area.radius=50;const changed=await call(body);assert.equal(changed.data.item.version,2);assert.equal(changed.data.item.property.approximateRadius,50);
 assert.equal((await fetch(base+media)).status,404);
 assert.equal((await call({action:'withdraw',id:body.id,version:2})).response.status,200);
 const withdrawn=await(await fetch(base+url)).text();assert.ok(withdrawn.includes('Error 404'));assert.ok(withdrawn.includes('noindex'));assert.ok(!withdrawn.includes('Coordinar visita'));
 assert.equal((await fetch(base+changed.data.item.property.photoUrls[0])).status,404);
 assert.equal((await call()).data.items[0].active,false);
 console.log('PASS HTTP: auth, catálogo vacío, publicación, detalle/WhatsApp, fotos, conflicto de versión, actualización y retiro.');
}finally{child.kill();await new Promise(r=>child.once('exit',r));fs.rmSync(root,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
