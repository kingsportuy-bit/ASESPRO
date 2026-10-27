(()=>{
 const el=id=>document.getElementById(id),canvas=el('comp-canvas'),ctx=canvas.getContext('2d');
 const layers={bg:null,text:null},names={bg:'',text:''};let current='post',pending=0,exporting=false;
 const defaults=()=>({bg:{mode:'cover',scale:100,x:0,y:0},text:{mode:'cover',scale:100,x:0,y:0}});
 const layouts={post:defaults(),story:defaults(),original:defaults()};
 const guideDefaults=INITIAL.compositionGuides||{post:{top:64,bottom:64,side:80},story:{top:160,bottom:160,side:80}};
 function size(){return current==='original'&&layers.bg?[layers.bg.naturalWidth,layers.bg.naturalHeight]:[1080,current==='story'?1920:1350];}
 function selectedLayer(){return document.querySelector('input[name="comp-layer"]:checked').value;}
 function settings(){return layouts[current][selectedLayer()];}
 function status(text){el('comp-status').textContent=text;}
 function updateArtboard(w,h){
  el('comp-artboard').style.setProperty('--comp-ratio',String(w/h));
  const story=current==='story'||(current==='original'&&h/w>=1.6),baseHeight=story?1920:1350;
  const top=(story?guideDefaults.story.top:guideDefaults.post.top)/baseHeight*100,bottom=(story?guideDefaults.story.bottom:guideDefaults.post.bottom)/baseHeight*100,side=(story?guideDefaults.story.side:guideDefaults.post.side)/1080*100;
  const guide=el('comp-safe-overlay');guide.style.inset=top+'% '+side+'% '+bottom+'%';
  const label=story?'ampliada de historias':'de publicación';
  el('comp-safe-note').textContent='Guía '+label+' orientativa: '+Math.round(h*top/100)+' px arriba · '+Math.round(h*bottom/100)+' px abajo · '+Math.round(w*side/100)+' px a cada lado. Área central: '+Math.round(h*(1-top/100-bottom/100))+' px de alto. No se incluye en la descarga.';
 }
 function render(){const [w,h]=size();if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  for(const key of ['bg','text']){if(key==='text'&&!el('comp-show-text').checked)continue;const img=layers[key];if(!img)continue;const s=layouts[current][key],iw=img.naturalWidth,ih=img.naturalHeight;let ratio=s.mode==='native'?1:s.mode==='cover'?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih);ratio*=s.scale/100;const dw=iw*ratio,dh=ih*ratio;ctx.drawImage(img,(w-dw)/2+s.x,(h-dh)/2+s.y,dw,dh);}
  updateArtboard(w,h);el('comp-dimensions').textContent=w+' × '+h+' px';el('comp-empty').hidden=!!(layers.bg||layers.text);el('comp-empty').style.display=layers.bg||layers.text?'none':'grid';el('comp-download').disabled=!layers.bg||!layers.text||pending>0||exporting;el('comp-clear-text').disabled=!layers.text;
 }
 function sync(){const [w,h]=size();el('comp-x').min=-w;el('comp-x').max=w;el('comp-y').min=-h;el('comp-y').max=h;const s=settings();for(const k of ['mode','scale','x','y'])el('comp-'+k).value=s[k];el('comp-scale-out').textContent=s.scale+'%';el('comp-x-out').textContent=s.x+' px';el('comp-y-out').textContent=s.y+' px';}
 function transparency(img){const sample=document.createElement('canvas');sample.width=160;sample.height=160;const c=sample.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,160,160);const a=c.getImageData(0,0,160,160).data;for(let i=3;i<a.length;i+=4)if(a[i]<255)return true;return false;}
 function describe(key){const img=layers[key];el('comp-'+(key==='bg'?'bg':'text')+'-info').textContent=img?names[key]+' · '+img.naturalWidth+' × '+img.naturalHeight+' px':'Cargá una imagen.';if(key==='text'&&img&&!transparency(img))status('La capa de texto no tiene transparencia visible: su fondo tapará la imagen inferior. Cargá un PNG transparente. No se elimina ningún fondo automáticamente.');else if(layers.bg&&layers.text)status('Las dos capas están listas. Elegí el formato y descargá la composición.');}
 function decode(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('No se pudo abrir la imagen. Usá PNG, JPG o WebP.'));img.src=src;});}
 const tickets={bg:0,text:0};
 async function upload(key,file){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status('Formato no admitido. Elegí PNG, JPG o WebP.');return;}if(file.size>60*1024*1024){status('La imagen supera 60 MB. Elegí un archivo más pequeño.');return;}const ticket=++tickets[key],url=URL.createObjectURL(file);pending++;render();status('Cargando '+file.name+'…');try{const img=await decode(url);if(ticket!==tickets[key])return;if(img.naturalWidth*img.naturalHeight>64000000)throw Error('La imagen supera 64 megapíxeles. Usá una versión de menor tamaño.');layers[key]=img;names[key]=file.name;layouts[current][key]={mode:'cover',scale:100,x:0,y:0};describe(key);sync();}catch(e){status(e.message);}finally{URL.revokeObjectURL(url);pending--;render();}}
 for(const [key,id] of [['bg','comp-bg-file'],['text','comp-text-file']])el(id).onchange=e=>upload(key,e.target.files[0]);
 el('comp-format').onchange=()=>{current=el('comp-format').value;sync();render();status(current==='original'?'Se conserva el tamaño en píxeles del fondo. Con capas del mismo tamaño y ajuste 1:1, no hay reescalado.':'Formato cambiado. Cada formato conserva sus ajustes de posición y escala.');};
 document.querySelectorAll('input[name="comp-layer"]').forEach(radio=>radio.addEventListener('change',sync));
 for(const key of ['mode','scale','x','y'])el('comp-'+key).addEventListener('input',()=>{const value=el('comp-'+key).value;if(key==='mode')settings()[key]=value;else{const n=Number(value);if(!Number.isFinite(n))return;settings()[key]=Math.max(key==='scale'?10:-10000,Math.min(key==='scale'?300:10000,n));}sync();render();});
 for(const [id,mode] of [['comp-fit','contain'],['comp-cover','cover']])el(id).onclick=()=>{for(const key of ['bg','text'])layouts[current][key]={mode,scale:100,x:0,y:0};sync();render();status(mode==='contain'?'Ambas capas completas, sin recorte ni deformación. Las zonas sin imagen conservan transparencia.':'Ambas capas cubren el lienzo. Se recortan los bordes que exceden el formato.');};
 el('comp-reset-layer').onclick=()=>{layouts[current][selectedLayer()]={mode:'cover',scale:100,x:0,y:0};sync();render();};
 el('comp-show-text').onchange=render;
 el('comp-toggle-safe').onclick=()=>{const show=el('comp-toggle-safe').getAttribute('aria-pressed')!=='true';el('comp-toggle-safe').setAttribute('aria-pressed',String(show));el('comp-toggle-safe').textContent=show?'Ocultar zona de seguridad':'Mostrar zona de seguridad';el('comp-safe-overlay').hidden=!show;el('comp-safe-note').hidden=!show;};
 el('comp-clear-text').onclick=()=>{tickets.text++;layers.text=null;names.text='';el('comp-text-file').value='';el('comp-text-info').textContent='Usá un PNG o WebP con transparencia.';render();};
 el('comp-example').onclick=async()=>{el('comp-example').disabled=true;pending++;const a=++tickets.bg,b=++tickets.text;render();status('Cargando las dos imágenes adjuntas…');try{const [bg,text]=await Promise.all([decode(COMPOSITOR_EXAMPLE.bg),decode(COMPOSITOR_EXAMPLE.text)]);if(a!==tickets.bg||b!==tickets.text)return;layers.bg=bg;layers.text=text;names.bg='Fondo adjunto.png';names.text='Capa de texto adjunta.png';layouts[current]=defaults();el('comp-show-text').checked=true;describe('bg');describe('text');sync();}catch(e){status(e.message);}finally{pending--;el('comp-example').disabled=false;render();}};
 el('comp-download').onclick=async()=>{const button=el('comp-download');if(exporting)return;exporting=true;const format=current,width=canvas.width,height=canvas.height;button.disabled=true;try{render();button.disabled=true;const blob=await new Promise((resolve,reject)=>{canvas.toBlob(b=>b?resolve(b):reject(Error('No se pudo crear el PNG.')),'image/png');});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ASESPRO-composicion-'+format+'-'+width+'x'+height+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('Composición PNG descargada · '+width+' × '+height+' px. Se exportó el lienzo de la vista previa.');}catch(e){status('No se pudo descargar: '+e.message);}finally{exporting=false;render();}};
 window.addEventListener('asespro-tab',event=>{if(event.detail==='tab-compositor')render();});
 sync();render();
})();
