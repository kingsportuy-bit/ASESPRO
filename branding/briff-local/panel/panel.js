'use strict';
const STORAGE='asespro.social.lab.v2';
const clone=x=>JSON.parse(JSON.stringify(x));
const $=id=>document.getElementById(id);
const hex=x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x);
const names={deep:'Profundo',primary:'Principal',mint:'Menta',paper:'Claro',accent:'Acento'};
const uses={deep:'Contraste y base oscura',primary:'Fondo y símbolos',mint:'Apoyo y campo claro',paper:'Texto y fondo claro',accent:'Detalle destacado'};
const logoLabels={mobile:'Isologo',vertical:'Normal',horizontal:'Horizontal'};
let state=clone(INITIAL),storageOK=true,logoSequence=0;
function sanitize(raw){
 const next=clone(INITIAL);
 if(!raw||typeof raw!=='object')throw Error('Archivo inválido');
 if(raw.colors)for(const k in next.colors)if(hex(raw.colors[k]))next.colors[k]=raw.colors[k].toUpperCase();
 const choices={theme:['dark','light'],background:['gradient','solid'],style:['regular','bold','duotone','fill']};
 for(const k in choices)if(choices[k].includes(raw[k]))next[k]=raw[k];
 for(const context of ['dark','light']){
  const variant=raw.logoConfigs?.[context]?.variant??raw.logoKind;
  if(['mobile','horizontal','vertical'].includes(variant))next.logoConfigs[context].variant=variant;
  for(const kind of Object.keys(logoLabels)){
   const color=raw.logoConfigs?.[context]?.variants?.[kind]?.color;
   if(hex(color))next.logoConfigs[context].variants[kind].color=color.toUpperCase();
  }
  const oldColor=raw.logoConfigs?.[context]?.color;
  if(!raw.logoConfigs?.[context]?.variants&&hex(oldColor))next.logoConfigs[context].variants[next.logoConfigs[context].variant].color=oldColor.toUpperCase();
  next.logoConfigs[context].color=next.logoConfigs[context].variants[next.logoConfigs[context].variant].color;
 }
 if(ICONS[raw.icon])next.icon=raw.icon;
 for(const [k,max] of [['title',85],['support',110]])if(typeof raw[k]==='string')next[k]=raw[k].slice(0,max);
 for(const [k,min,max] of [['weight',600,900],['typeSize',80,124],['iconSize',260,520],['angle',-25,25]])if(Number.isFinite(Number(raw[k])))next[k]=Math.min(max,Math.max(min,Number(raw[k])));
 next.safe=raw.safe===true;return next;
}
try{const cached=localStorage.getItem(STORAGE);if(cached)state=sanitize(JSON.parse(cached));}catch(e){storageOK=false;}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));storageOK=true;}catch(e){storageOK=false;}$('save-status').textContent=storageOK?'Borrador guardado en este navegador.':'Usá «Exportar ajustes» para conservar el borrador.';}
function cssColors(node){for(const k in state.colors)node.style.setProperty('--p-'+k,state.colors[k]);}
function luminosity(color){let a=color.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;}
function uniqueSvg(svg){const prefix='svg'+(++logoSequence)+'-';const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);for(const id of ids){svg=svg.replaceAll('id="'+id+'"','id="'+prefix+id+'"').replaceAll('href="#'+id+'"','href="#'+prefix+id+'"').replaceAll('url(#'+id+')','url(#'+prefix+id+')');}return svg;}
function previewBackground(){return state.theme==='dark'?state.colors.deep:state.colors.paper;}
function logoColor(background){return luminosity(background)<.4?'#FFFFFF':'#009335';}
function activeLogoContext(){return logoColor(previewBackground())==='#FFFFFF'?'dark':'light';}
function coloredLogo(kind,unique=true,background=previewBackground(),explicitColor=null){
 const doc=new DOMParser().parseFromString(LOGOS[kind],'image/svg+xml');
 const color=explicitColor||logoColor(background);
 doc.querySelectorAll('[data-original-fill]').forEach(el=>{
  el.setAttribute('fill',color);
 });
 const svg=new XMLSerializer().serializeToString(doc.documentElement);return unique?uniqueSvg(svg):svg;
}
function iconSvg(id=state.icon){return ICONS[id].variants[state.style];}
function download(text,filename,mime){const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderPalette(){
 const host=$('palette');host.replaceChildren();
 for(const key in names){
  const card=document.createElement('div');card.className='swatch';
  card.innerHTML='<input class="picker" type="color" aria-label="Color '+names[key]+'"><label>'+names[key]+'</label><input class="hex" maxlength="7" aria-label="HEX '+names[key]+'"><small>'+uses[key]+'</small>';
  const picker=card.querySelector('.picker'),field=card.querySelector('.hex');picker.value=field.value=state.colors[key];
  picker.addEventListener('input',()=>{state.colors[key]=picker.value.toUpperCase();field.value=state.colors[key];field.classList.remove('invalid');update();});
  field.addEventListener('input',()=>{if(hex(field.value)){state.colors[key]=field.value.toUpperCase();picker.value=field.value;field.classList.remove('invalid');update();}else field.classList.add('invalid');});
  host.append(card);
 }
}
function renderLibrary(){
 const query=$('icon-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),category=$('icon-category').value;
 const list=Object.entries(ICONS).filter(([id,item])=>(category==='all'||category===item.category)&&(item.label+' '+item.category+' '+id).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));
 $('library-count').textContent=list.length+' de '+Object.keys(ICONS).length+' símbolos';
 const library=$('icon-library');library.replaceChildren();cssColors(library);
 for(const [id,item] of list){
  const card=document.createElement('div');card.className='icon-card'+(state.icon===id?' selected':'');
  const pick=document.createElement('button');pick.className='icon-pick';pick.setAttribute('aria-label','Usar '+item.label);pick.setAttribute('aria-pressed',state.icon===id?'true':'false');pick.innerHTML=item.variants[state.style];
  const label=document.createElement('span');label.textContent=item.label;pick.append(label);
  pick.addEventListener('click',()=>{state.icon=id;$('symbol').value=id;update();renderLibrary();});
  const dl=document.createElement('button');dl.className='icon-download';dl.textContent='Descargar SVG';
  dl.addEventListener('click',()=>download(item.variants[state.style].replaceAll('currentColor',state.colors.primary),id+'-'+state.style+'.svg','image/svg+xml'));
  card.append(pick,dl);library.append(card);
 }
 if(!list.length){const p=document.createElement('div');p.className='empty';p.textContent='No hay símbolos para esa búsqueda.';library.append(p);}
}
function buildLogoCards(){
 for(const context of ['dark','light']){
  const host=$('logo-'+context+'-variants');host.replaceChildren();
  for(const kind of Object.keys(logoLabels)){
   const id='logo-'+context+'-'+kind,card=document.createElement('div');card.className='logo-variant-card';card.id=id+'-card';
   card.innerHTML='<h4>'+logoLabels[kind]+'</h4><div class="logo-canvas config-logo '+kind+(context==='light'?' light':'')+'" id="'+id+'-preview"></div><label>Color del logo<input type="color" id="'+id+'-color" aria-label="Color '+logoLabels[kind]+' '+context+'"></label><input class="hex" maxlength="7" id="'+id+'-hex" aria-label="HEX '+logoLabels[kind]+' '+context+'"><div class="logo-card-actions"><button id="'+id+'-pick">Usar este logo</button><button id="'+id+'-download">Descargar SVG</button></div>';
   host.append(card);
   const picker=$(id+'-color'),field=$(id+'-hex');
   picker.addEventListener('input',()=>{state.logoConfigs[context].variants[kind].color=picker.value.toUpperCase();field.value=picker.value.toUpperCase();field.classList.remove('invalid');update();});
   field.addEventListener('input',()=>{if(hex(field.value)){state.logoConfigs[context].variants[kind].color=field.value.toUpperCase();picker.value=field.value;field.classList.remove('invalid');update();}else field.classList.add('invalid');});
   $(id+'-pick').addEventListener('click',()=>{state.logoConfigs[context].variant=kind;update();});
   $(id+'-download').addEventListener('click',()=>{const color=state.logoConfigs[context].variants[kind].color;download(coloredLogo(kind,false,state.colors[state.logoConfigs[context].backgroundRole],color),'ASESPRO-'+logoLabels[kind].toLowerCase()+'-'+context+'-'+color.slice(1)+'.svg','image/svg+xml');});
  }
 }
}
function renderLogos(){
 for(const context of ['dark','light']){
  const config=state.logoConfigs[context],background=state.colors[config.backgroundRole];
  config.color=config.variants[config.variant].color;
  for(const kind of Object.keys(logoLabels)){
   const id='logo-'+context+'-'+kind,color=config.variants[kind].color,node=$(id+'-preview');
   node.innerHTML=coloredLogo(kind,true,background,color);node.style.backgroundColor=background;
   $(id+'-color').value=color;if(document.activeElement!==$(id+'-hex'))$(id+'-hex').value=color;
   $(id+'-card').classList.toggle('selected',config.variant===kind);
   $(id+'-pick').textContent=config.variant===kind?'Seleccionado':'Usar este logo';$(id+'-pick').setAttribute('aria-pressed',config.variant===kind?'true':'false');
  }
  $('logo-'+context+'-kind').value=config.variant;
  $('logo-'+context+'-summary').textContent='Guardado para '+(context==='dark'?'fondo oscuro: ':'fondo claro: ')+logoLabels[config.variant]+' · '+config.color;
 }
}
function update(){
 const formats=$('formats');cssColors(formats);formats.className='formats '+state.theme+' '+state.background+(state.safe?' show-safe':'');
 formats.style.setProperty('--title-size',state.typeSize+'px');formats.style.setProperty('--title-weight',state.weight);formats.style.setProperty('--symbol-size',state.iconSize+'px');formats.style.setProperty('--symbol-angle',state.angle+'deg');
 document.querySelectorAll('.hook').forEach(n=>n.textContent=state.title);document.querySelectorAll('.support').forEach(n=>n.textContent=state.support);document.querySelectorAll('.visual').forEach(n=>n.innerHTML=iconSvg());
 const context=activeLogoContext(),logoConfig=state.logoConfigs[context];logoConfig.color=logoConfig.variants[logoConfig.variant].color;
 document.querySelectorAll('.stamp').forEach(n=>{n.className='stamp '+logoConfig.variant;n.innerHTML=coloredLogo(logoConfig.variant,true,previewBackground(),logoConfig.color);});
 $('logo-kind').value=logoConfig.variant;
 $('active-logo-context').textContent='Selección para '+(context==='dark'?'fondo oscuro: ':'fondo claro: ')+logoLabels[logoConfig.variant]+' · '+logoConfig.color;
 $('type-value').textContent=state.typeSize+' px';$('icon-value').textContent=state.iconSize+' px';$('angle-value').textContent=state.angle+'°';
 $('font-sample').style.fontWeight=state.weight;
 const [a,b]=state.theme==='dark'?[state.colors.paper,state.colors.deep]:[state.colors.deep,state.colors.paper];
 const l1=luminosity(a),l2=luminosity(b),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);$('contrast').textContent='Contraste texto / fondo base: '+ratio.toFixed(1)+':1';
 cssColors($('icon-library'));renderLogos();save();
}
const bindings={'title':'title','support':'support','theme':'theme','background':'background','symbol':'icon','icon-style':'style','weight':'weight','type-size':'typeSize','icon-size':'iconSize','icon-angle':'angle'};
function sync(){for(const id in bindings)$(id).value=state[bindings[id]];$('safe').checked=state.safe;$('library-style').value=state.style;renderPalette();buildLogoCards();update();renderLibrary();}
for(const id in bindings)$(id).addEventListener('input',()=>{let key=bindings[id],v=$(id).value;state[key]=['weight','typeSize','iconSize','angle'].includes(key)?Number(v):v;if(key==='style'){$('library-style').value=v;renderLibrary();}if(key==='icon')renderLibrary();update();});
$('safe').addEventListener('change',()=>{state.safe=$('safe').checked;update();});
$('library-style').addEventListener('input',()=>{state.style=$('library-style').value;$('icon-style').value=state.style;renderLibrary();update();});
$('icon-search').addEventListener('input',renderLibrary);$('icon-category').addEventListener('input',renderLibrary);
$('reset-palette').addEventListener('click',()=>{state.colors=clone(INITIAL.colors);renderPalette();update();});
$('export-config').addEventListener('click',()=>download(JSON.stringify({...state,font:'Switzer',web:'inmobiliaria.asespro.com.uy',status:'draft',phoneInArtwork:false,exportedAt:new Date().toISOString()},null,2),'ASESPRO-ajustes-borrador.json','application/json'));
$('import-config').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{state=sanitize(JSON.parse(await file.text()));sync();$('save-status').textContent='Ajustes importados y guardados como borrador.';}catch(e){$('save-status').textContent='No se pudo importar: elegí un JSON de ajustes del panel.';}event.target.value='';});
for(const context of ['dark','light'])$('logo-'+context+'-kind').addEventListener('input',()=>{state.logoConfigs[context].variant=$('logo-'+context+'-kind').value;update();});
$('logo-kind').addEventListener('input',()=>{state.logoConfigs[activeLogoContext()].variant=$('logo-kind').value;update();});
sync();
