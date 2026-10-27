const PropiedadVideo=(()=>{
 const e=id=>document.getElementById('pv-'+id);let file=null,url=null,source=null,edited=null,rendering=false,generation=0,uploadPromise=null;
 const say=s=>e('status').textContent=s,video=e('preview');
 const logoSvg=coloredLogo('horizontal',false,INITIAL.colors.deep,'#FFFFFF');e('logo-preview').src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(logoSvg);
 function notify(){window.dispatchEvent(new Event('asespro-video-change'));}
 function invalidate(){trimUI();generation++;edited=null;e('download').hidden=true;e('export').disabled=!file||rendering;notify();}
 function preview(){video.playbackRate=Number(e('speed').value);video.muted=e('mute').checked;e('logo-preview').hidden=!file||!e('logo').checked;document.querySelector('.pv-stage').style.aspectRatio=document.getElementById('prop-format').value==='story'?'9/16':'3/4';e('logo-preview').style.top=document.getElementById('prop-format').value==='story'?'8.854%':'4.861111%';}
 function time(value){const n=Math.round(Math.max(0,Number(value)||0)*10);return Math.floor(n/600)+':'+((n%600)/10).toFixed(1).padStart(4,'0');}
 function trimUI(){
  const duration=Number.isFinite(video.duration)?video.duration:0,start=Number(e('start').value)||0,end=Number(e('end').value)||0,speed=Number(e('speed').value),valid=duration>0&&start>=0&&end<=duration+.05&&end-start>=.2;
  for(const key of ['start','end']){e(key+'-range').max=duration;e(key+'-range').value=e(key).value;e(key+'-range').disabled=!duration||rendering;e(key+'-time').textContent=time(e(key).value);}
  e('trim-toggle').disabled=!duration||!file||rendering;
  e('original-duration').textContent=time(duration);
  e('trim-selection').style.left=(duration?start/duration*100:0)+'%';e('trim-selection').style.width=(duration?Math.max(0,end-start)/duration*100:100)+'%';
  e('trim-playhead').style.left=(duration?video.currentTime/duration*100:0)+'%';
  e('trim-summary').textContent=!duration?'Video completo':!valid?'Revisá el tramo':(start<.05&&Math.abs(end-duration)<.05?'Video completo':'Recorte '+time(start)+' – '+time(end))+' · '+time((end-start)/speed);
  e('trim-result').textContent=!duration?'Cargá un video para elegir el tramo.':!valid?'El final debe ser posterior al inicio y el tramo debe durar al menos 0,2 segundos.':'Se conserva '+time(start)+' → '+time(end)+' · Duración final: '+time((end-start)/speed)+(speed!==1?' a '+speed+'×':'');
  e('trim-preview').disabled=!valid;e('play').disabled=!valid;
  document.querySelector('.pv-trim-track').setAttribute('aria-label',valid?'Se conserva desde '+time(start)+' hasta '+time(end):'Tramo no válido');
 }
 function openTrim(open){e('trim-editor').hidden=!open;e('trim-toggle').setAttribute('aria-expanded',String(open));if(open)e('start-range').focus();else e('trim-toggle').focus();}
 e('trim-toggle').onclick=()=>openTrim(e('trim-editor').hidden);
 e('trim-done').onclick=()=>{const start=Number(e('start').value),end=Number(e('end').value);if(!Number.isFinite(start)||!Number.isFinite(end)||end-start<.2||start<0||end>video.duration+.05){trimUI();return;}openTrim(false);say('Recorte elegido. Exportá el MP4 para guardar el video con estos ajustes.');};
 e('trim-reset').onclick=()=>{e('start').value=0;e('end').value=video.duration.toFixed(2);video.currentTime=0;invalidate();trimUI();};
 for(const key of ['start','end'])e(key+'-range').oninput=()=>{
  const duration=video.duration;let value=Number(e(key+'-range').value);if(key==='start')value=Math.min(value,Number(e('end').value)-.2);else value=Math.max(value,Number(e('start').value)+.2);
  const defaultValue=key==='start'?0:duration;if(Math.abs(value-defaultValue)<Math.min(.5,duration*.01))value=defaultValue;
  e(key).value=Math.max(0,Math.min(duration,value)).toFixed(2);video.pause();video.currentTime=Number(e(key).value);invalidate();trimUI();
 };
 e('file').onchange=()=>{const f=e('file').files[0];if(!f)return;if(f.size>250*1024*1024){say('El video supera 250 MB.');return;}video.pause();if(url)URL.revokeObjectURL(url);file=f;source=null;uploadPromise=null;url=URL.createObjectURL(f);video.src=url;e('trim-editor').hidden=true;e('trim-toggle').setAttribute('aria-expanded','false');e('remove').disabled=false;invalidate();preview();say('Leyendo el video…');};
 video.onloadedmetadata=()=>{if(!Number.isFinite(video.duration)||video.duration<=0){say('No se pudo determinar la duración.');return;}e('start').value=0;e('end').value=video.duration.toFixed(2);e('end').max=e('start').max=video.duration;say('Duración original: '+video.duration.toFixed(1)+' s. Pulsá «Recortar video» para elegir el tramo.');preview();trimUI();};video.onerror=()=>say('El navegador no puede reproducir este video. Podés intentar exportarlo localmente o cargarlo como MP4 H.264.');
 for(const k of ['logo','speed','start','end','mute'])e(k).addEventListener('input',()=>{invalidate();preview();});e('include').onchange=notify;document.getElementById('prop-format').addEventListener('change',()=>{invalidate();preview();});
 for(const [id,key] of [['mark-start','start'],['mark-end','end']])e(id).onclick=()=>{e(key).value=video.currentTime.toFixed(2);invalidate();};
 video.addEventListener('timeupdate',()=>{const duration=Number.isFinite(video.duration)?video.duration:0;e('trim-playhead').style.left=(duration?video.currentTime/duration*100:0)+'%';if(!video.paused&&video.currentTime>=Number(e('end').value))video.pause();});
 e('play').onclick=async()=>{if(!file)return;say('Reproduciendo el recorte.');video.currentTime=Number(e('start').value);preview();try{await video.play();}catch{say('No se pudo reproducir este video en el navegador.');}};
 e('remove').onclick=()=>{if(rendering){say('Esperá a que termine la exportación.');return;}video.pause();video.removeAttribute('src');video.load();if(url)URL.revokeObjectURL(url);url=null;file=null;source=null;edited=null;e('file').value='';e('remove').disabled=true;invalidate();preview();say('Video quitado del carrusel.');};
 e('trim-preview').onclick=()=>e('play').click();
 async function logoPng(){const image=new Image();image.src=e('logo-preview').src;await image.decode();const c=document.createElement('canvas');c.width=900;c.height=Math.round(900*image.height/image.width);c.getContext('2d').drawImage(image,0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];}
 async function jsonPost(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Asespro-Token':apiToken},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw Error(d.error);return d;}
 async function ensure(){if(!file||!e('include').checked)return null;if(edited)return edited;if(rendering)throw Error('El video se está exportando. Esperá a que termine.');if(!apiToken)throw Error('Abrí INICIAR_PANEL.cmd para exportar video con FFmpeg local.');const start=Number(e('start').value),end=Number(e('end').value);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start<.2)throw Error('Revisá inicio y final del video.');const ticket=generation;rendering=true;trimUI();e('export').disabled=true;e('file').disabled=true;e('remove').disabled=true;try{
  if(!source){say('Cargando el original al servidor local…');const r=await fetch('/api/video/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Asespro-Token':apiToken},body:file});const d=await r.json();if(!r.ok)throw Error(d.error);source=d;}
  say('Exportando MP4 localmente. Puede tardar según la duración…');const job=await jsonPost('/api/video/render',{id:source.id,start,end,speed:Number(e('speed').value),format:document.getElementById('prop-format').value,logo:e('logo').checked,logoPng:e('logo').checked?await logoPng():null,mute:e('mute').checked});
  while(true){await new Promise(r=>setTimeout(r,1200));const r=await fetch('/api/video/status/'+job.id),s=await r.json();if(!r.ok||s.state==='error')throw Error(s.error||'No se pudo completar el video.');if(s.state==='done')break;}
  if(ticket!==generation)throw Error('Cambiaste los ajustes durante la exportación. Exportá de nuevo para aplicar esos cambios.');const path='/api/video/file/'+job.id,r=await fetch(path);if(!r.ok)throw Error('No se pudo descargar el video editado.');edited={name:'video-inmueble.mp4',blob:await r.blob()};e('download').href=path;e('download').hidden=false;say('MP4 listo: '+((end-start)/Number(e('speed').value)).toFixed(1)+' s, con los ajustes elegidos.');return edited;
 }finally{rendering=false;trimUI();e('export').disabled=!file;e('file').disabled=false;e('remove').disabled=!file;}}
 e('export').onclick=async()=>{try{const inc=e('include').checked;e('include').checked=true;await ensure();e('include').checked=inc;}catch(error){say(error.message);}};
 trimUI();
 return {ensure,has:()=>!!file&&e('include').checked};
})();
