const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'asespro-tests-'));
for(const name of ['panelWebModel','panelWebStore']){
 const file=path.join(__dirname,'../src/lib',name+'.ts');
 if(fs.existsSync(file))fs.writeFileSync(path.join(dir,name+'.js'),ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
}
const {validatePublication}=require(path.join(dir,'panelWebModel.js'));
const valid=()=>({id:'web-12345678-1234-4234-8234-123456789abc',version:0,data:{operation:'ALQUILER',type:'Casa',zone:'Zona centro',beds:'0',baths:'1',built:'60',details:'Recientemente reciclada',garage:'yes'},area:{lat:-32.82,lng:-56.52,radius:500},phone:'59899715662',reviewed:true});
test('whitelists public data and uses only the selected area',()=>{
 const input=valid();input.price=123;input.address='Privado 123';input.data.price=456;
 const result=validatePublication(input);
 assert.equal(result.property.price,undefined);assert.equal(result.property.address,undefined);
 assert.equal(result.property.bedrooms,0);assert.equal(result.property.lat,-32.82);
 assert.equal(result.property.approximateRadius,500);assert.equal(result.data.price,undefined);
});
test('rejects unsafe public text, invalid area and absent review',()=>{
 for(const edit of [x=>x.data.zone='Calle Rivera 123',x=>x.data.details='USD 2000',x=>x.data.details='Rivera 123',x=>x.area.radius=10,x=>x.area.lat=null,x=>x.reviewed=false,x=>x.data.beds='-1',x=>x.id='../secret',x=>x.phone='123']){
  const input=valid();edit(input);assert.throws(()=>validatePublication(input));
 }
});
test('accepts a 50 metre zone and rejects smaller zones',()=>{
 const input=valid();input.area.radius=50;assert.equal(validatePublication(input).property.approximateRadius,50);input.area.radius=49;assert.throws(()=>validatePublication(input));
});
test('supports every property type in the IG panel without coercing it to house',()=>{
 for(const type of ['Casa','Apartamento','Terreno','Local comercial','Oficina','Depósito']){const input=valid();input.data.type=type;assert.ok(validatePublication(input).property.type);}
});
test('atomic updates, duplicate retry, conflicts and withdrawal',async()=>{
 process.env.PANEL_WEB_DATA_DIR=path.join(dir,'catalog');
 const {savePublication,listPublications,getPublication,readPhoto,withdrawPublication}=require(path.join(dir,'panelWebStore.js'));
 const input=valid();const jpeg=Buffer.from([255,216,255,224,0,0,255,217]);
 const first=await savePublication(input,[jpeg]);assert.equal(first.version,1);
 assert.equal((await listPublications()).length,1);
 await assert.rejects(()=>savePublication(input,[jpeg]),/versión|actualiz/i);
 const photo=first.property.photoUrls[0].split('/');
 assert.deepEqual(await readPhoto(input.id,photo.at(-2),photo.at(-1)),jpeg);
 await withdrawPublication(input.id,1);assert.equal((await listPublications()).length,0);
 assert.equal(await getPublication(input.id),null);
 await assert.rejects(()=>readPhoto(input.id,photo.at(-2),photo.at(-1)));
});
process.on('exit',()=>fs.rmSync(dir,{recursive:true,force:true}));
