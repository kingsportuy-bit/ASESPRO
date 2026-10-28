(()=>{
 const el=id=>document.getElementById('web-'+id),editor=window.AsesproPropertyEditor;
 let map,circle,area=null,current=null,working=false,site='',catalog=[],draftId='web-'+crypto.randomUUID(),reviewRevision=null;
 const status=text=>el('status').textContent=text;
 function invalidate(){el('reviewed').checked=false;reviewRevision=null;}
 function controls(){for(const id of ['publish','connect','refresh','new','toros','centenario','use-center','radius','phone','reviewed'])el(id).disabled=working;for(const button of el('catalog').querySelectorAll('button'))button.disabled=working;el('publish').textContent=current?'Actualizar en la web':'Publicar solo en la web';}
 async function api(action,payload={}){
  if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(location.origin))throw Error('Abrí INICIAR_PANEL.cmd para publicar en la web.');
  const response=await fetch('/api/current',{cache:'no-store'});if(!response.ok)throw Error('No se pudo conectar con el servidor local.');const {token}=await response.json();
  const result=await fetch('/api/web/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Asespro-Token':token},body:JSON.stringify(payload)});
  if(!result.headers.get('content-type')?.includes('application/json'))throw Error('Reiniciá el panel con INICIAR_PANEL.cmd para activar la carga web.');
  const body=await result.json();if(!result.ok)throw Error(body.error||'No se pudo completar la carga web.');return body;
 }
 async function task(callback){if(working)return;working=true;controls();try{await editor.run(callback);}catch(error){status(error.message);}finally{working=false;controls();}}
 function selectArea(lat,lng){if(working)return;area={lat:Number(lat.toFixed(4)),lng:Number(lng.toFixed(4)),radius:Number(el('radius').value)};invalidate();drawArea();}
 function drawArea(){if(!map||!area)return;if(circle)circle.remove();circle=L.circle([area.lat,area.lng],{radius:area.radius,color:'#009335',fillOpacity:.2,weight:2}).addTo(map);el('area-status').textContent='Zona aproximada elegida · '+area.radius+' m de radio. El círculo completo será público.';}
 function initMap(){if(map){setTimeout(()=>map.invalidateSize(),0);return;}if(!window.L){el('area-status').textContent='No se pudo cargar el mapa local. Reiniciá el panel.';return;}
  map=L.map(el('map'),{scrollWheelZoom:false}).setView([-32.8167,-56.5167],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);map.on('click',e=>selectArea(e.latlng.lat,e.latlng.lng));drawArea();
 }
 el('section').addEventListener('toggle',()=>{if(el('section').open)initMap();});
 window.addEventListener('asespro-tab',()=>{if(map)setTimeout(()=>map.invalidateSize(),0);});
 el('toros').onclick=()=>{initMap();map?.setView([-32.8167,-56.5167],14);};
 el('centenario').onclick=()=>{initMap();map?.setView([-32.838,-56.505],14);};
 el('use-center').onclick=()=>{initMap();if(map){const p=map.getCenter();selectArea(p.lat,p.lng);}};
 el('radius').oninput=()=>{el('radius-label').textContent=el('radius').value+' m de radio';if(area){area.radius=Number(el('radius').value);drawArea();}invalidate();};
 el('phone').oninput=invalidate;
 el('reviewed').onchange=()=>{reviewRevision=el('reviewed').checked?editor.snapshot().revision:null;};
 // Changes to IG data or media invalidate the independent web review without affecting IG controls.
 const observer=new MutationObserver(()=>{if(reviewRevision!==null&&editor.snapshot().revision!==reviewRevision)invalidate();});observer.observe(document.getElementById('prop-photos'),{childList:true});
 document.getElementById('propiedades-panel').addEventListener('input',event=>{if(!event.target.id.startsWith('web-'))invalidate();});
 document.getElementById('propiedades-panel').addEventListener('click',()=>{if(reviewRevision!==null&&editor.snapshot().revision!==reviewRevision)invalidate();});
 function link(item){el('view').href=site+'/propiedad/'+encodeURIComponent(item.id);el('view').hidden=!item.active;}
 function renderCatalog(){const host=el('catalog');host.replaceChildren();if(!catalog.length){host.textContent='Todavía no hay propiedades cargadas a la web.';return;}
  for(const item of catalog){const row=document.createElement('article'),name=document.createElement('p');name.textContent=item.property.title+' · '+(item.active?'Publicada':'Retirada');row.append(name);const actions=document.createElement('div');actions.className='brand-actions';
   if(item.active){const view=document.createElement('a');view.textContent='Ver en la web';view.href=site+'/propiedad/'+item.id;view.target='_blank';view.rel='noopener noreferrer';actions.append(view);
    const load=document.createElement('button');load.type='button';load.textContent='Cargar para editar';load.onclick=()=>{if(!confirm('¿Cargar esta propiedad? Se reemplazarán los datos y fotos del editor actual.'))return;task(async()=>{status('Cargando datos y fotos de la web…');const result=await api('load',{id:item.id});await editor.load(result.item.data,result.photos);current=result.item;draftId=current.id;area={...current.area};el('phone').value=current.phone;el('radius').value=area.radius;el('radius-label').textContent=area.radius+' m de radio';initMap();map?.setView([area.lat,area.lng],14);drawArea();link(current);invalidate();status('Propiedad cargada. Los cambios web no modifican la publicación de Instagram.');});};actions.append(load);
    const remove=document.createElement('button');remove.type='button';remove.textContent='Retirar de la web';remove.onclick=()=>{if(!confirm('¿Retirar esta propiedad de la web? La publicación de Instagram se conserva.'))return;task(async()=>{await api('withdraw',{id:item.id,version:item.version});if(current?.id===item.id){current={...current,active:false,version:item.version+1};link(current);}await refresh();invalidate();status('Propiedad retirada de la web.');});};actions.append(remove);
   }row.append(actions);host.append(row);
  }controls();
 }
 async function refresh(){const response=await api('list');catalog=response.items;renderCatalog();}
 el('refresh').onclick=()=>task(async()=>{await refresh();status('Catálogo actualizado.');});
 el('connect').onclick=()=>task(async()=>{const response=await api('config',{url:el('url').value,key:el('key').value});el('key').value='';site=response.url;el('connection').textContent='Conexión web comprobada: '+site;await refresh();status('Conexión guardada.');});
 el('new').onclick=()=>{if(working||!confirm('¿Preparar otra publicación web con los datos y fotos actuales? Tendrá una referencia nueva.'))return;current=null;draftId='web-'+crypto.randomUUID();area=null;if(circle){circle.remove();circle=null;}el('view').hidden=true;el('area-status').textContent='Elegí la zona de la nueva propiedad.';invalidate();controls();status('Nueva referencia preparada. Completá o reemplazá los datos y fotos, elegí la zona y revisá antes de publicar.');};
 el('publish').onclick=()=>task(async()=>{
  const snapshot=editor.snapshot();if(!snapshot.count)throw Error('Cargá las fotos del inmueble en la sección 3.');if(!area)throw Error('Elegí primero una zona aproximada en el mapa.');if(!el('reviewed').checked||reviewRevision!==snapshot.revision)throw Error('Revisá los datos y marcá la casilla de revisión web.');
  const phone=el('phone').value.replace(/\D/g,'');if(!/^598\d{8}$/.test(phone))throw Error('WhatsApp: ingresá 598 y los 8 dígitos del número.');
  const selectedArea={...area};status('Preparando fotos para la web…');const photos=await editor.photos();if(editor.snapshot().revision!==snapshot.revision)throw Error('Los datos cambiaron. Revisá antes de publicar.');
  status('Publicando en la web…');const response=await api('publish',{id:current?.id||draftId,version:current?.version||0,data:snapshot.data,area:selectedArea,phone,photos,reviewed:true});current=response.item;link(current);invalidate();status('Propiedad publicada en la web. Instagram conserva su publicación independiente.');try{await refresh();}catch{status('Propiedad publicada. No se pudo refrescar el catálogo; podés abrir el enlace y reintentar Actualizar catálogo.');}
 });
 (async()=>{try{const result=await api('status');site=result.url;el('url').value=site;el('connection').textContent=result.configured?'Conexión guardada: '+site:'Conexión web pendiente. Abrí Configurar conexión web.';if(result.configured)await refresh();}catch(error){el('connection').textContent=error.message;}})();
 controls();
})();
