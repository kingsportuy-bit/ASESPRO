const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');

async function setup(){
 const nodes=new Map();
 class Element{
  constructor(id=''){this.id=id;this.value='';this.textContent='';this.checked=false;this.disabled=false;this.hidden=true;this.dataset={};this.children=[];}
  addEventListener(){} setAttribute(key,value){this[key]=value;} querySelectorAll(){return [];}
  append(...children){this.children.push(...children);}replaceChildren(){this.children=[];}
  scrollIntoView(){this.scrolled=true;} focus(){this.focused=true;}
 }
 const el=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
 el('web-phone').value='59899715662';el('web-radius').value='50';el('web-feedback').dataset.state='idle';
 let saved=null,mode='ok',posts=0,revision=1;
 const response=data=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>data});
 const fetch=async(url,options)=>{
  if(url==='/api/current')return response({token:'test'});
  if(url==='/api/web/status')return response({configured:true,url:'https://example.test'});
  if(url==='/api/web/list'){if(mode==='offline')throw Error('Sin conexión');return response({items:saved?[saved]:[]});}
  if(url==='/api/web/publish'){
   posts++;const input=JSON.parse(options.body);
   if(mode==='reject')return {ok:false,headers:{get:()=> 'application/json'},json:async()=>({error:'Revisá la zona pública.'})};
   if(mode==='offline')throw Error('Sin conexión');
   saved={id:input.id,version:input.version+1,active:true,property:{title:'Casa en zona centro',photoUrls:['one.jpg']}};
   if(mode==='lost')throw Error('Se perdió la respuesta');
   return response({item:saved});
  }
  throw Error('Unexpected URL '+url);
 };
 const map={setView(){return this;},getCenter(){return {lat:-32.82,lng:-56.52};},on(){},invalidateSize(){}};
 const editor={snapshot:()=>({count:1,data:{operation:'ALQUILER'},revision}),media:async()=>({photos:['photo'],video:null}),run:async task=>task()};
 const window={AsesproPropertyEditor:editor,addEventListener(){}};
 const context={window,document:{getElementById:el,createElement:()=>new Element()},location:{origin:'http://127.0.0.1:8765'},crypto:webcrypto,MutationObserver:class{observe(){}},fetch,confirm:()=>true,setTimeout,clearTimeout,AbortController,L:{map:()=>map,tileLayer:()=>({addTo(){}}),circle:()=>({addTo(){return this;},remove(){}})}};
 window.L=context.L;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../branding/briff-local/panel/propiedades-web.js'),'utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {el,mode:value=>mode=value,posts:()=>posts,prepare(){el('web-use-center').onclick();el('web-reviewed').checked=true;el('web-reviewed').onchange();},edit(){revision++;}};
}
test('missing area produces a visible error and keeps the publish action available',async()=>{
 const ui=await setup();await ui.el('web-publish').onclick();
 assert.equal(ui.el('web-result-title').textContent,'No se publicó en la web');assert.match(ui.el('web-status').textContent,/zona aproximada/);
 assert.equal(ui.el('web-feedback').focused,true);assert.equal(ui.el('web-publish').disabled,false);assert.equal(ui.posts(),0);
});
test('success has an explicit confirmation, public link and changed-data state',async()=>{
 const ui=await setup();ui.prepare();await ui.el('web-publish').onclick();
 assert.equal(ui.el('web-result-title').textContent,'Publicada en la web');assert.equal(ui.el('web-view').hidden,false);assert.match(ui.el('web-view').href,/example.test\/propiedad\/web-/);
 assert.equal(ui.el('web-badge').textContent,'Publicada');assert.equal(ui.posts(),1);
 ui.el('web-phone').oninput();assert.equal(ui.el('web-feedback').dataset.state,'dirty');
});
test('server validation error says it did not publish and shows the reason',async()=>{
 const ui=await setup();ui.prepare();ui.mode('reject');await ui.el('web-publish').onclick();assert.equal(ui.el('web-feedback').dataset.state,'error');assert.match(ui.el('web-status').textContent,/Revisá la zona pública/);assert.equal(ui.el('web-view').hidden,true);
});
test('lost response reconciles with saved version without a duplicate POST',async()=>{
 const ui=await setup();ui.prepare();ui.mode('lost');await ui.el('web-publish').onclick();assert.equal(ui.el('web-feedback').dataset.state,'success');assert.equal(ui.posts(),1);
});
test('connection failure is unconfirmed rather than a false failure or success',async()=>{
 const ui=await setup();ui.prepare();ui.mode('offline');await ui.el('web-publish').onclick();assert.equal(ui.el('web-feedback').dataset.state,'unknown');assert.match(ui.el('web-status').textContent,/Comprobar si se publicó/);
});
test('checking the empty server explicitly says nothing has been published',async()=>{
 const ui=await setup();await ui.el('web-check').onclick();assert.equal(ui.el('web-result-title').textContent,'No hay ninguna propiedad publicada en la web');assert.equal(ui.posts(),0);
});
test('checking while offline never says it was not published',async()=>{
 const ui=await setup();ui.mode('offline');await ui.el('web-check').onclick();assert.equal(ui.el('web-feedback').dataset.state,'unknown');assert.equal(ui.posts(),0);
});
test('checking a saved property preserves notice of unpublished edits',async()=>{
 const ui=await setup();ui.prepare();await ui.el('web-publish').onclick();ui.el('web-phone').oninput();await ui.el('web-check').onclick();assert.equal(ui.el('web-feedback').dataset.state,'dirty');assert.equal(ui.posts(),1);
});
