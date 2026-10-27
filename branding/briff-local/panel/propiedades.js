(()=>{
 const $p=id=>document.getElementById('prop-'+id),M=PropiedadModelo,canvas=$p('canvas'),ctx=canvas.getContext('2d');
 let extensionVersion='',data=M.initial(),photos=[],active=0,cleanCover=false,busy=false,revision=0,renderTicket=0,copyDirty=false,selected=new Set(),extension=false;const cache=new Map();
 const keys=Object.keys(data),extraLabels={garage:'Cochera',wash:'Zona de lavado',patio:'Patio',pool:'Piscina',balcony:'Balcón',bbq:'Parrillero',woodstove:'Estufa a leña',equipped:'Equipado',water:'Agua incluida',wifi:'Wi-Fi incluido',cable:'TV cable incluido'};
 for(const [key,label] of Object.entries(extraLabels)){const l=document.createElement('label');l.textContent=label;const s=document.createElement('select');s.id='prop-'+key;for(const [value,text] of [['','No informado'],['yes','Sí'],['no','No']])s.add(new Option(text,value));l.append(s);$p('extras').append(l);}
 const say=s=>{$p('status').textContent=s;if($p('action-status'))$p('action-status').textContent=s;};
 function changed(){revision++;$p('reviewed').checked=false;updateButtons();if(copyDirty)$p('copy-note').textContent='Los datos cambiaron. Tu copy editado se conserva; revisalo o actualizalo con los datos.';else $p('copy').value=M.copy(data);syncCarousel();}
 function read(){for(const k of keys)data[k]=$p(k).value;}
 function fill(){for(const k of keys)$p(k).value=data[k];featureControls(true);$p('copy').value=M.copy(data);copyDirty=false;render();syncCarousel();}
 function featureControls(reset=false){const available=M.features(data);if(reset)selected=new Set(available.slice(0,6).map(f=>f.key));else{for(const k of selected)if(!available.some(f=>f.key===k))selected.delete(k);}const host=$p('features');host.replaceChildren();if(!available.length){host.textContent='Completá las características disponibles.';return;}for(const f of available){const label=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=selected.has(f.key);c.onchange=()=>{if(c.checked&&selected.size>=6){c.checked=false;say('La portada admite hasta seis características. Desmarcá otra para cambiarla.');return;}c.checked?selected.add(f.key):selected.delete(f.key);changed();render();};label.append(c,document.createTextNode(f.label));host.append(label);}}
 for(const k of keys)$p(k).addEventListener('input',()=>{read();featureControls(true);changed();render();});
 $p('copy').oninput=()=>{copyDirty=true;revision++;$p('reviewed').checked=false;$p('copy-note').textContent='Copy editado manualmente.';updateButtons();syncCarousel();};
 $p('copy-clipboard').onclick=async()=>{try{await navigator.clipboard.writeText($p('copy').value);say('Copy copiado.');}catch{say('No se pudo acceder al portapapeles. Seleccioná y copiá el texto del campo.');}};
 function decode(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Imagen no compatible'));image.src=url;});}
 function svgImage(svg){if(!cache.has(svg))cache.set(svg,decode('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)));return cache.get(svg);}
 function cropped(c,p,w,h){const r=Math.max(w/p.image.width,h/p.image.height)*p.zoom/100,dw=p.image.width*r,dh=p.image.height*r;c.drawImage(p.image,(w-dw)/2+(w-dw)*p.x/200,(h-dh)/2+(h-dh)*p.y/200,dw,dh);}
 function fitText(c,text,x,y,max,size,weight=700){c.font=weight+' '+size+'px Switzer';while(c.measureText(text).width>max&&size>24){size--;c.font=weight+' '+size+'px Switzer';}c.fillText(text,x,y);}
 function titleText(){return (data.type||'Inmueble')+(data.equipped==='yes'?' equipado':'');}
 async function draw(c,p,index,w,h){await document.fonts.ready;c.clearRect(0,0,w,h);c.fillStyle=INITIAL.colors.deep;c.fillRect(0,0,w,h);if(p)cropped(c,p,w,h);else{c.fillStyle=INITIAL.colors.primary;c.fillRect(0,0,w,h);c.fillStyle=INITIAL.colors.mint;c.font='500 32px Switzer';c.textAlign='center';c.fillText('Subí una foto del inmueble',w/2,h*.35);c.textAlign='left';}
  const logo=await svgImage(coloredLogo('horizontal',false,INITIAL.colors.deep,'#FFFFFF'));
  const top=h===1920?170:70,topEnd=top+230,topGradient=c.createLinearGradient(0,0,0,topEnd);topGradient.addColorStop(0,'rgba('+INITIAL.colors.deep.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')+',.75)');topGradient.addColorStop(.48,'rgba('+INITIAL.colors.deep.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')+',.42)');topGradient.addColorStop(1,'rgba('+INITIAL.colors.deep.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')+',0)');c.fillStyle=topGradient;c.fillRect(0,0,w,topEnd);
  if(index===0){const bottom=h===1920?160:64,base=h-bottom,fs=M.features(data).filter(f=>selected.has(f.key)).slice(0,6);const rows=Math.ceil(fs.length/3),area=rows>1?390:303;const grad=c.createLinearGradient(0,base-area-220,0,h);grad.addColorStop(0,'rgba('+INITIAL.colors.deep.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')+',0)');grad.addColorStop(.38,'rgba('+INITIAL.colors.deep.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')+',.85)');grad.addColorStop(1,INITIAL.colors.deep);c.fillStyle=grad;c.fillRect(0,base-area-220,w,h);c.fillStyle='#FFFFFF';const logoW=300,logoH=logo.height/logo.width*logoW;c.drawImage(logo,80,h===1920?170:70,logoW,logoH);c.fillStyle=INITIAL.colors.accent;c.font='700 27px Switzer';c.fillText(data.operation||'OPERACIÓN',80,base-area+20);c.fillStyle='#FFFFFF';fitText(c,titleText(),80,base-area+91,920,64);fitText(c,data.zone||'Zona a confirmar',80,base-area+143,920,35,500);
   const icons=await Promise.all(fs.map(f=>svgImage(ICONS[f.icon].variants.regular.replaceAll('currentColor','#FFFFFF'))));for(let i=0;i<fs.length;i++){const x=80+(i%3)*308,y=base-area+205+Math.floor(i/3)*87;c.drawImage(icons[i],x,y-30,43,43);fitText(c,fs[i].label,x+56,y+3,240,27,500);}c.font='500 25px Switzer';c.fillStyle=INITIAL.colors.mint;c.fillText('inmobiliaria.asespro.com.uy',80,base-5);
  }else{const lw=300,lh=logo.height/logo.width*lw;c.drawImage(logo,80,top,lw,lh);}
 }
 async function render(){const ticket=++renderTicket,w=1080,h=$p('format').value==='story'?1920:1440;const off=document.createElement('canvas');off.width=w;off.height=h;try{await draw(off.getContext('2d'),photos[active],active===0&&!cleanCover?0:1,w,h);if(ticket!==renderTicket)return;canvas.width=w;canvas.height=h;ctx.drawImage(off,0,0);$p('guides').style.inset=(h===1920?'8.33333%':'4.444444%')+' 7.4074%';$p('preview-title').textContent=(active===0?(cleanCover?'Foto 2 · portada sin información':'Portada'):'Foto '+(active+2))+' · '+w+' × '+h;syncCrop();updateButtons();syncCarousel();}catch(e){say('No se pudo dibujar la vista previa: '+e.message);}}
 function syncCrop(){const p=photos[active];for(const key of ['zoom','x','y']){$p(key).disabled=!p;$p(key).value=p?p[key]:(key==='zoom'?100:0);$p(key+'-out').textContent=$p(key).value+(key==='zoom'?'%':'');}}
 function thumbs(){const host=$p('photos');host.replaceChildren();photos.forEach((p,i)=>{const card=document.createElement('div');card.className='prop-photo'+(i===active&&!cleanCover?' active':'');const pick=document.createElement('button'),img=document.createElement('img');img.src=p.url;img.alt='Foto '+(i+1);pick.append(img,document.createTextNode(i===0?'Portada':'Foto '+(i+2)));pick.onclick=()=>{showPhotoPreview();active=i;cleanCover=false;thumbs();render();};card.append(pick);const actions=document.createElement('div');actions.className='prop-photo-actions';for(const [label,action,disabled] of [['←',()=>move(i,i-1),i===0],['→',()=>move(i,i+1),i===photos.length-1],['Portada',()=>move(i,0),i===0],['Quitar',()=>{URL.revokeObjectURL(p.url);photos.splice(i,1);cleanCover=false;active=Math.max(0,Math.min(active,photos.length-1));changed();thumbs();render();},false]]){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.setAttribute('aria-label',label+' foto '+(i+1));b.onclick=action;actions.append(b);}card.append(actions);host.append(card);if(i===0){const duplicate=document.createElement('div');duplicate.className='prop-photo'+(active===0&&cleanCover?' active':'');const b=document.createElement('button'),im=document.createElement('img');im.src=p.url;im.alt='Misma foto de portada, sin información';b.append(im,document.createTextNode('Foto 2 · sin información'));b.onclick=()=>{showPhotoPreview();active=0;cleanCover=true;thumbs();render();};duplicate.append(b);const note=document.createElement('p');note.className='hint';note.textContent='Repetición automática · solo logo';duplicate.append(note);host.append(duplicate);}});}
 function showPhotoPreview(){
  $p('image-preview').hidden=false;$p('crop').hidden=false;$p('video-review').hidden=true;document.getElementById('pv-preview').pause();
  const stage=document.querySelector('.pv-stage');if(stage&&stage.parentElement!==document.getElementById('pv-editor-slot'))document.getElementById('pv-editor-slot').append(stage);
 }
 $p('preview-video').onclick=()=>{
  $p('image-preview').hidden=true;$p('crop').hidden=true;$p('video-review').hidden=false;
  $p('video-review-slot').append(document.querySelector('.pv-stage'));
  $p('preview-title').textContent='Video · último elemento del carrusel';$p('preview-video').setAttribute('aria-pressed','true');syncCarousel();
 };
 function syncVideoReview(){const has=PropiedadVideo.has();$p('preview-video').hidden=!has;if(!has)showPhotoPreview();syncCarousel();}
 window.addEventListener('asespro-video-change',syncVideoReview);
 function carouselIndex(){return !$p('video-review').hidden?photos.length+1:active===0?(cleanCover?1:0):active+1;}
 function carouselTotal(){return (photos.length?photos.length+1:0)+(PropiedadVideo.has()?1:0);}
 function chooseSlide(index){
  const total=carouselTotal();if(index<0||index>=total)return;
  if(PropiedadVideo.has()&&index===(photos.length?photos.length+1:0)){$p('preview-video').click();return;}
  showPhotoPreview();active=index<2?0:index-1;cleanCover=index===1;thumbs();render();syncCarousel();
 }
 function syncCarousel(){
  const total=carouselTotal(),index=total?Math.min(carouselIndex(),total-1):0;
  $p('prev').disabled=!total||index===0;$p('next').disabled=!total||index===total-1;
  $p('carousel-count').textContent=total?(index+1)+' / '+total:'Sin archivos';
  $p('caption-preview').textContent=$p('copy').value||'El copy de la publicación aparecerá aquí.';
  const dots=$p('carousel-dots');dots.replaceChildren();
  for(let i=0;i<total;i++){const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',PropiedadVideo.has()&&i===total-1?'Ver video':'Ver imagen '+(i+1));dot.setAttribute('aria-pressed',String(i===index));dot.onclick=()=>chooseSlide(i);dots.append(dot);}
  const isVideo=!$p('video-review').hidden;$p('video-review-note').hidden=!isVideo;
  if(isVideo)$p('video-review-note').textContent='Video con logo, recorte y velocidad elegidos. Exportá el MP4 para ver el archivo final.';
 }
 $p('prev').onclick=()=>chooseSlide(carouselIndex()-1);$p('next').onclick=()=>chooseSlide(carouselIndex()+1);
 $p('carousel').onkeydown=event=>{if(event.target!==$p('carousel'))return;if(event.key==='ArrowLeft'){event.preventDefault();chooseSlide(carouselIndex()-1);}if(event.key==='ArrowRight'){event.preventDefault();chooseSlide(carouselIndex()+1);}};
 function move(i,j){const [p]=photos.splice(i,1);photos.splice(j,0,p);active=j;cleanCover=false;changed();thumbs();render();}
 $p('files').onchange=async e=>{if(busy)return;busy=true;updateButtons();const files=[...e.target.files],errors=[];for(const file of files){if(photos.length>=19){errors.push('Máximo 19 fotos originales más la repetición automática de portada');break;}if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>25*1024*1024){errors.push(file.name);continue;}const url=URL.createObjectURL(file);try{const image=await decode(url);if(image.width*image.height>40000000)throw Error('Demasiados píxeles');photos.push({image,url,zoom:100,x:0,y:0});}catch{URL.revokeObjectURL(url);errors.push(file.name);}}busy=false;e.target.value='';changed();thumbs();await render();say(photos.length+' fotos originales · '+(photos.length?photos.length+1:0)+' imágenes en el carrusel (portada repetida sin información).'+(errors.length?' No se cargaron: '+errors.join(', '):''));};
 for(const k of ['zoom','x','y'])$p(k).oninput=()=>{if(!photos[active])return;photos[active][k]=Number($p(k).value);changed();render();};$p('format').onchange=()=>{changed();render();};
 $p('safe').onclick=()=>{const show=$p('safe').getAttribute('aria-pressed')!=='true';$p('safe').setAttribute('aria-pressed',String(show));$p('safe').textContent=show?'Ocultar zona de seguridad':'Mostrar zona de seguridad';$p('guides').hidden=!show;};
 function validation(){if(!data.zone.trim())return 'Indicá una zona pública genérica.';if(/\d|\b(calle|avenida|av\.|bulevar|bvar|ruta|esquina|apto\.?|unidad)\b/i.test(data.zone))return 'La zona pública debe excluir calle, número y unidad.';if(!data.operation||!data.type)return 'Indicá operación y tipo.';for(const k of ['beds','baths','built','land']){const n=Number(data[k]);if(data[k]!==''&&(!Number.isFinite(n)||n<0||(['beds','baths'].includes(k)&&!Number.isInteger(n))))return 'Revisá las cantidades y superficies: deben ser números positivos.';}if(!$p('copy').value.trim())return 'Completá el copy.';if(/(?:US\$|U\$S|USD|UYU|\$)\s*\d|\b(?:precio|direccion|dirección|apto\.?\s*\d|18 de julio)\b/i.test($p('copy').value))return 'El copy parece contener precio, dirección o unidad. Revisalo.';return '';}
 function updateButtons(){const ready=photos.length>0&&!busy&&$p('reviewed').checked;for(const k of ['png','zip'])$p(k).disabled=!ready;$p('publish').disabled=busy;$p('test-extension').disabled=busy;$p('files').disabled=busy;}
 $p('reset').onclick=()=>{if(busy||aiRequest){say('Esperá a que termine la operación antes de reiniciar.');return;}if(!confirm('¿Reiniciar esta propiedad? Se quitarán sus datos, fotos, video y copy. La clave de OpenAI y los ajustes de marca se conservan.'))return;location.reload();};
 $p('reviewed').onchange=updateButtons;
 async function files(){const err=validation();if(err)throw Error(err);if(!photos.length||!$p('reviewed').checked)throw Error('Cargá fotos y confirmá la revisión.');const version=revision,images=[],w=1080,h=$p('format').value==='story'?1920:1440;await document.fonts.ready;const slides=photos.length?[photos[0],photos[0],...photos.slice(1)]:[];for(let i=0;i<slides.length;i++){const cv=document.createElement('canvas');cv.width=w;cv.height=h;await draw(cv.getContext('2d'),slides[i],i,w,h);const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.94));if(!blob)throw Error('No se pudo exportar una foto.');images.push({name:String(i+1).padStart(2,'0')+(i===0?'-portada':'-foto')+'.jpg',blob});if(version!==revision)throw Error('La composición cambió. Revisá y volvé a exportar.');}if(PropiedadVideo.has()){if(images.length>=20)throw Error('El carrusel admite hasta 20 archivos. Con video, cargá hasta 18 fotos originales más la repetición de portada.');const v=await PropiedadVideo.ensure();if(version!==revision)throw Error('Cambió la composición durante la exportación del video. Revisá y volvé a intentar.');if(v)images.push({...v,name:String(images.length+1).padStart(2,'0')+'-video.mp4'});}return images;}
 async function run(task){if(busy)return;busy=true;updateButtons();try{await task();}catch(e){say(e.message);}finally{busy=false;updateButtons();}}
 $p('png').onclick=()=>run(async()=>{const error=validation();if(error)throw Error(error);await render();const b=await new Promise(r=>canvas.toBlob(r,'image/png'));download(b,'ASESPRO-propiedad-'+(active===0?(cleanCover?2:1):active+2)+'.png','image/png');say('Imagen descargada, sin guías.');});
 $p('zip').onclick=()=>run(async()=>{const images=await files(),zip={'COPY.txt':fflate.strToU8($p('copy').value),'LEEME.txt':fflate.strToU8('Carrusel ASESPRO. Imágenes en orden. Sin precio ni dirección exacta. Revisar antes de publicar.')};for(const f of images)zip[f.name]=new Uint8Array(await f.blob.arrayBuffer());download(fflate.zipSync(zip),'ASESPRO-propiedad-carrusel.zip','application/zip');say('Carrusel y copy descargados. No se publicó en Instagram.');});
 const requests=new Map();
 function receiveExtension(result){const pending=requests.get(result?.id);if(!pending)return;if(result.stage==='bridge-received'){pending.received=true;return;}if(typeof result.ok!=='boolean')return;clearTimeout(pending.timer);requests.delete(result.id);result.ok?pending.resolve(result):pending.reject(Error(result.error||'La extensión no pudo completar la acción.'));}
 window.addEventListener('ASESPRO_EXTENSION_REPLY',event=>{try{receiveExtension(JSON.parse(event.detail));}catch{}});
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.channel==='ASESPRO_EXTENSION_RESULT')receiveExtension(event.data);});
 function request(action,payload={},timeout=10000){return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),pending={resolve,reject,received:false};pending.timer=setTimeout(()=>{requests.delete(id);reject(Error(pending.received?'La extensión recibió la solicitud, pero no terminó de abrir Instagram. Revisá Errores en chrome://extensions antes de reenviar.':'El panel no recibió respuesta del puente de Chrome. Comprobá que ASESPRO indique versión 0.2.3 y recargá esta pestaña después de actualizarla.'));},timeout);requests.set(id,pending);const message={id,action,...payload};window.dispatchEvent(new CustomEvent('ASESPRO_EXTENSION_REQUEST',{detail:JSON.stringify(message)}));if(requests.has(id))window.postMessage({channel:'ASESPRO_PANEL',...message},location.origin);});}
 async function check(){try{const result=await request('ping');extension=true;extensionVersion=result.version||'';$p('extension-status').textContent='Extensión conectada · versión '+(result.version||'desconocida')+' · este perfil de Chrome.';return true;}catch(e){extension=false;$p('extension-status').textContent=e.message;return false;}finally{updateButtons();}}$p('extension-check').onclick=check;
 async function sendToExtension(dryRun=false){return run(async()=>{say('Comprobando conexión con la extensión…');if(!await check())throw Error($p('extension-status').textContent);if(extensionVersion!=='0.2.15')throw Error('Para enviar archivos por partes necesitás la extensión 0.2.15. Recargála antes de iniciar la prueba.');if(!photos.length)throw Error('Cargá las fotos del inmueble antes de publicar.');if(!$p('reviewed').checked)throw Error('Marcá la casilla «Revisé fotos y copy» antes de publicar.');if($p('format').value!=='post')throw Error('Para publicar carrusel elegí Publicación 1080 × 1440.');say('Preparando las imágenes del carrusel'+(PropiedadVideo.has()?' y el video editado':'')+'…');const images=await files(),chunkSize=1024*1024,total=images.reduce((sum,f)=>sum+f.blob.size,0);if(total>500*1024*1024)throw Error('Los archivos exportados superan el límite local de 500 MiB por carrusel.');const metadata=images.map(f=>({name:f.name,size:f.blob.size,chunks:Math.ceil(f.blob.size/chunkSize)}));const upload=await request('startUpload',{job:{account:'asespro.inmobiliaria',caption:$p('copy').value,images:metadata,dryRun}});let opened=false;try{let sent=0;for(let index=0;index<images.length;index++){const f=images[index];for(let chunk=0;chunk<metadata[index].chunks;chunk++){const blob=f.blob.slice(chunk*chunkSize,(chunk+1)*chunkSize),data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});await request('appendMedia',{job:{uploadId:upload.uploadId,index,chunk,data}},45000);sent+=blob.size;say('Enviando archivos a la extensión: '+Math.round(sent/total*100)+' % · '+(total/1048576).toFixed(1)+' MiB exportados.');}}await request('publish',{job:{uploadId:upload.uploadId}},45000);opened=true;}finally{if(!opened)await request('finishJob',{job:{uploadId:upload.uploadId}}).catch(()=>{});}say(dryRun?'Prueba enviada a la extensión: debe detenerse antes de Compartir. No publiques el borrador de prueba.':'Enviado a la extensión. Seguí el estado en la pestaña de Instagram; esto todavía no confirma la publicación.');});}
 $p('publish').onclick=()=>sendToExtension(false);
 $p('test-extension').onclick=()=>sendToExtension(true);
 let aiProposal=null,aiRequest=false,aiConfigured=false;
 const aiSay=text=>$p('ai-status').textContent=text;
 async function aiPost(path,body){
  if(location.origin!=='http://127.0.0.1:8765')throw Error('Abrí INICIAR_PANEL.cmd para usar OpenAI desde el servidor local.');
  async function refreshToken(){const response=await fetch('/api/current',{cache:'no-store'});if(!response.ok)throw Error('No se pudo conectar con el servidor local.');apiToken=(await response.json()).token;}
  if(!apiToken)await refreshToken();
  const send=()=>fetch('/api/ai/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-Asespro-Token':apiToken},body:JSON.stringify(body)});
  let response=await send();if(response.status===403){await refreshToken();response=await send();}
  if(response.status===404||response.headers.get('Content-Type')?.includes('text/html'))throw Error('Reiniciá el servidor con INICIAR_PANEL.cmd para cargar la integración de OpenAI.');
  const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo completar la solicitud.');return result;
 }

 function aiControls(){for(const k of ['ai-save','ai-remove','ai-detect','ai-copy','ai-another','ai-apply'])$p(k).disabled=aiRequest;}
 function aiConfig(result){aiConfigured=result.configured;$p('ai-availability').textContent=result.available===true?'Disponible · acceso al modelo':result.configured?'Clave guardada · comprobar conexión':'No disponible · sin clave';if(result.available===false&&result.configured)$p('ai-availability').textContent='No disponible · '+(result.reason||'revisar conexión');$p('ai-config-status').textContent=result.configured?'Clave guardada · '+result.model+' · se verificará al generar.':'Sin clave guardada. Pegala arriba y pulsá Guardar clave.';}
 $p('ai-save').onclick=async()=>{if(aiRequest)return;aiRequest=true;aiControls();try{aiConfig(await aiPost('config',{key:$p('ai-key').value}));$p('ai-key').value='';}catch(error){$p('ai-config-status').textContent=error.message;}finally{aiRequest=false;aiControls();}};
 $p('ai-remove').onclick=async()=>{if(aiRequest)return;aiRequest=true;aiControls();try{aiConfig(await aiPost('config',{remove:true}));$p('ai-key').value='';}catch(error){$p('ai-config-status').textContent=error.message;}finally{aiRequest=false;aiControls();}};
 async function aiGenerate(mode){
  if(aiRequest||busy)return;
  read();if(mode==='detect'&&!$p('source').value.trim()){aiSay('Pegá primero la información de la propiedad en «Detectar datos de una descripción».');return;}
  const ticket=revision,sourceText=$p('source').value;aiRequest=true;aiControls();aiSay(mode==='detect'?'OpenAI está detectando los datos y creando el copy con emojis…':'OpenAI está creando una propuesta de copy…');
  try{
   aiConfig(await aiPost('status',{check:true}));
   if(!aiConfigured)throw Error('No hay una clave de OpenAI configurada.');
   const result=await aiPost('generate',mode==='detect'?{mode,source:sourceText}:{mode,data:{...data},previous:aiProposal?.mode==='copy'?aiProposal.result.copy:$p('copy').value});
   if(ticket!==revision||(mode==='detect'&&sourceText!==$p('source').value)){aiSay('Cambiaste los datos durante la generación. Generá otra propuesta con la información actual.');return;}
   if(mode==='detect'){
    for(const key of keys)data[key]=result.data[key]||'';fill();
    $p('copy').value=result.copy;copyDirty=true;changed();
    aiProposal=null;$p('ai-proposal').hidden=true;
    $p('copy-note').textContent='Copy creado con IA y emojis. Podés editarlo antes de publicar.';
    $p('parse-status').textContent='Datos y copy cargados con IA. '+(result.warnings||[]).join(' ');
    aiSay('Datos y copy cargados. Revisalos antes de marcar la casilla de revisión.');return;
   }
   aiProposal={mode,result,revision:ticket,source:sourceText};$p('ai-proposal').hidden=false;
   $p('ai-proposal-title').textContent=mode==='detect'?'Datos propuestos por IA':'Copy propuesto por IA';
   $p('ai-preview').textContent=mode==='copy'?result.copy:Object.entries(result.data).filter(([,value])=>value!=='').map(([key,value])=>{const label=extraLabels[key]||{operation:'Operación',type:'Tipo',zone:'Zona',beds:'Dormitorios',baths:'Baños',built:'m² construidos',land:'m² terreno',expenses:'Gastos comunes',details:'Detalle público'}[key]||key;return label+': '+({yes:'Sí',no:'No',none:'Sin gastos comunes',included:'Incluidos'}[value]||value);}).join('\n');
   $p('ai-warnings').textContent=(result.warnings||['Revisá los datos y el texto antes de usarlo.']).join(' ');$p('ai-another').textContent=mode==='copy'?'Otra versión':'Volver a detectar';aiSay('Propuesta lista. Tu publicación todavía conserva el contenido anterior.');
  }catch(error){
   if(ticket!==revision||(mode==='detect'&&sourceText!==$p('source').value)){aiSay('Cambiaste los datos. Volvé a generar con la información actual.');return;}
   const notice='IA no disponible. Se usó '+(mode==='detect'?'la detección normal.':'el copy normal como alternativa.');
   const result=mode==='detect'?M.parse(sourceText):{copy:M.copy(data)};
   if(mode==='detect'){
    for(const key of keys)data[key]=result.data[key]||'';fill();changed();aiProposal=null;$p('ai-proposal').hidden=true;
    $p('parse-status').textContent=notice+' Motivo: '+error.message+' '+result.warnings.join(' ');
    $p('copy-note').textContent='Copy de respaldo sin IA. Podés volver a generarlo con IA.';aiSay(notice+' Motivo: '+error.message);return;
   }

   aiProposal={mode,result,revision:ticket,source:sourceText};$p('ai-proposal').hidden=false;
   $p('ai-proposal-title').textContent=mode==='detect'?'Datos detectados · sin IA':'Copy de respaldo · sin IA';
   $p('ai-preview').textContent=mode==='copy'?result.copy:Object.entries(result.data).filter(([,value])=>value!=='').map(([key,value])=>{const label=extraLabels[key]||{operation:'Operación',type:'Tipo',zone:'Zona',beds:'Dormitorios',baths:'Baños',built:'m² construidos',land:'m² terreno',expenses:'Gastos comunes',details:'Detalle público'}[key]||key;return label+': '+({yes:'Sí',no:'No',none:'Sin gastos comunes',included:'Incluidos'}[value]||value);}).join('\n');
   $p('ai-warnings').textContent=[notice,...(result.warnings||[]),error.message].join(' ');$p('ai-another').textContent='Reintentar con IA';aiSay(notice+' Motivo: '+error.message);
   if(mode==='detect')$p('parse-status').textContent=notice+' '+error.message;
  }finally{aiRequest=false;aiControls();}
 }
 $p('ai-detect').onclick=()=>aiGenerate('detect');$p('ai-copy').onclick=()=>aiGenerate('copy');$p('ai-another').onclick=()=>aiGenerate(aiProposal?.mode||'copy');
 $p('ai-discard').onclick=()=>{aiProposal=null;$p('ai-proposal').hidden=true;aiSay('Propuesta descartada.');};
 $p('ai-apply').onclick=()=>{
  if(!aiProposal)return;
  if(revision!==aiProposal.revision||(aiProposal.mode==='detect'&&$p('source').value!==aiProposal.source)){aiSay('La información cambió. Generá una propuesta nueva antes de aplicarla.');return;}
  if(aiProposal.mode==='copy'){$p('copy').value=aiProposal.result.copy;copyDirty=true;changed();$p('copy-note').textContent='Copy aplicado. Podés editarlo; revisalo antes de publicar.';}
  else{for(const key of keys)data[key]=aiProposal.result.data[key]||'';fill();changed();$p('parse-status').textContent=aiProposal.result.warnings.join(' ');}
  aiProposal=null;$p('ai-proposal').hidden=true;aiSay('Propuesta aplicada. Revisá y marcá «Revisé fotos y copy» antes de publicar.');
 };
 async function loadAI(){for(let attempt=0;attempt<25&&!apiToken;attempt++)await new Promise(resolve=>setTimeout(resolve,200));try{aiConfig(await aiPost('status',{check:true}));}catch(error){$p('ai-config-status').textContent=error.message;}}
 loadAI();
 window.addEventListener('asespro-video-change',changed);fill();thumbs();if(location.protocol==='http:')setTimeout(check,500);window.addEventListener('asespro-tab',e=>{if(e.detail==='tab-propiedades')render();});
})();
