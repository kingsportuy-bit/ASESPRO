const PropiedadModelo=(()=>{
 const extras={garage:['garage','Cochera'],wash:['washing-machine','Lavadero'],patio:['plant','Patio'],pool:['swimming-pool','Piscina'],balcony:['buildings','Balcón'],bbq:['flame','Parrillero'],woodstove:['wood-stove','Estufa a leña'],equipped:['couch','Equipada']};
 const initial=()=>Object.fromEntries(['operation','type','zone','beds','baths','built','land','garage','wash','patio','pool','balcony','bbq','equipped','water','wifi','cable','expenses','details','woodstove'].map(key=>[key,'']));
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function parse(source){const t=norm(source),d=Object.fromEntries(Object.keys(initial()).map(k=>[k,''])),warnings=[];d.operation=/\bventa\b/.test(t)?'VENTA':/\balquil/.test(t)?'ALQUILER':'';d.type=/\b(apartamento|apto|departamento)\b/.test(t)?'Apartamento':/\bcasa\b/.test(t)?'Casa':/\bterreno\b/.test(t)?'Terreno':/\blocal\b/.test(t)?'Local comercial':'';if(/\b(centrica|centrico|centro)\b/.test(t))d.zone='Zona céntrica';
  for(const [key,rx] of [['beds',/(\d+)\s*(?:dorm\w*|habitaciones?|hab\b)/],['baths',/(\d+)\s*banos?/],['built',/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|metros cuadrados)\s*(?:construidos|edificados|cubiertos)/],['land',/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|metros cuadrados)\s*(?:de terreno|terreno)/]]){const m=t.match(rx);if(m)d[key]=m[1].replace(',','.');}
  for(const [key,rx] of Object.entries({garage:'(?:cochera|garage|garaje)',wash:'(?:zona de lavado|lavadero)',patio:'patio',pool:'piscina',balcony:'balcon',bbq:'parrillero',woodstove:'(?:estufa a lena|estufa de lena|salamandra)',equipped:'(?:equipad[oa]|amueblad[oa])'})){if(new RegExp('\\b'+rx+'\\b').test(t))d[key]=new RegExp('(?:sin|no (?:tiene|cuenta con|hay))\\s+(?:\\w+\\s+){0,2}'+rx+'\\b').test(t)?'no':'yes';}
  for(const [key,rx] of [['water','agua'],['wifi','wi[ -]?fi'],['cable','(?:tv\\s*)?cable']])if(new RegExp(rx).test(t)&&/incluid/.test(t)){d[key]='yes';warnings.push('Confirmá que '+({water:'agua',wifi:'Wi-Fi',cable:'TV cable'}[key])+' esté incluido.');}
  if(/gastos comunes/.test(t)){if(/sin gastos comunes/.test(t))d.expenses='none';else if(/gastos comunes\s+incluidos/.test(t))d.expenses='included';else{d.expenses='yes';warnings.push('Gastos comunes: se detectó que existen, no que estén incluidos.');}}
  warnings.push('Revisá los datos detectados. La dirección, el precio y el número de unidad no se trasladan automáticamente.');return {data:d,warnings};
 }
 function features(d){const a=[];if(d.beds!=='')a.push({key:'beds',icon:'bed',label:Number(d.beds)===0?'Monoambiente':d.beds+' dorm.'});if(d.baths!=='')a.push({key:'baths',icon:'bathtub',label:d.baths+' baño'+(Number(d.baths)===1?'':'s')});if(d.built)a.push({key:'built',icon:'ruler',label:d.built+' m² const.'});if(d.land)a.push({key:'land',icon:'bounding-box',label:d.land+' m² terreno'});for(const [k,[icon,label]] of Object.entries(extras))if(d[k]==='yes')a.push({key:k,icon,label});return a;}
 function copy(d){
  if(!d.operation&&!d.type)return '';
  const operation={ALQUILER:'en alquiler',VENTA:'en venta','ALQUILER TEMPORAL':'en alquiler temporal'}[d.operation]||'';
  const female=['Casa','Oficina'].includes(d.type),equipped=female?'equipada':'equipado';
  const title=[d.type, d.equipped==='yes'?equipped:'',operation].filter(Boolean).join(' ');
  const lines=[title+(d.zone?' · '+d.zone:'')+' 🏡'];
  const novelDetails=String(d.details||'').split(/(?<=[.!?])\s+|[;\n]|,\s*/).map(part=>part.trim()).filter(Boolean).filter(part=>{
   let rest=norm(part).replace(/[.!?]/g,'');
   const escape=value=>norm(String(value)).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   for(const [key,unit] of [['beds','(?:dormitorios?|dorm\\b|habitaciones?)'],['baths','banos?']])if(d[key]!=='')rest=rest.replace(new RegExp('\\b'+escape(d[key])+'\\s*'+unit+'\\b','g'),'');
   if(d.zone)rest=rest.replace(new RegExp('\\b'+escape(d.zone)+'\\b','g'),'');
   if(d.type)rest=rest.replace(new RegExp('\\b'+escape(d.type)+'\\b','g'),'');
   if(d.operation)rest=rest.replace(new RegExp('\\b'+escape(d.operation)+'\\b','g'),'');
   if(d.expenses==='none')rest=rest.replace(/(?:sin|no paga|no tiene|no hay) gastos comunes/g,'');
   if(d.expenses==='included')rest=rest.replace(/gastos comunes incluidos/g,'');
   if(d.expenses==='yes')rest=rest.replace(/(?:tiene|con) gastos comunes/g,'');
   rest=rest.replace(/\b(?:de|con|y|en|el|la|un|una|ubicado|ubicada|pleno|plena|zona)\b/g,'').replace(/[^a-z0-9]/g,'');
   return !!rest;
  });
  if(novelDetails.length){const text=novelDetails.join('. ').replace(/[.!?]+$/,'');lines.push(text.charAt(0).toUpperCase()+text.slice(1)+'.');}
  const emojis={beds:'🛏️',baths:'🚿',built:'📐',land:'📏',garage:'🚗',wash:'🧺',patio:'🌿',pool:'🏊',balcony:'☀️',bbq:'🔥',woodstove:'🔥'};
  const f=features(d).filter(x=>x.key!=='equipped').map(x=>{
   const label=x.key==='wash'?'Zona de lavado':x.label.replace('dorm.','dormitorio'+(Number(d.beds)===1?'':'s')).replace('const.','construidos');
   return emojis[x.key]+' '+label;
  });
  if(f.length)lines.push(f.join('\n'));
  const inc=[['water','Agua'],['wifi','Wi-Fi'],['cable','TV cable']].filter(([k])=>d[k]==='yes').map(([,v])=>v);
  if(inc.length){const list=inc.length>1?inc.slice(0,-1).join(', ')+' y '+inc.at(-1):inc[0];lines.push(list+' '+(inc.length===1?(inc[0]==='Agua'?'incluida':'incluido'):'incluidos')+'.');}
  const expenses={none:'Sin gastos comunes.',included:'Gastos comunes incluidos.',yes:'Tiene gastos comunes.'};
  if(expenses[d.expenses])lines.push(expenses[d.expenses]);
  lines.push('📩 Escribinos por privado y coordinamos una visita.','ASESPRO Inmobiliaria\ninmobiliaria.asespro.com.uy');
  const tags=['#AsesproInmobiliaria'];
  if(d.operation==='ALQUILER')tags.push('#Alquiler');
  if(d.operation==='VENTA')tags.push('#Venta');
  if(d.operation==='ALQUILER TEMPORAL')tags.push('#AlquilerTemporal');
  const typeTags={Apartamento:'#Apartamento',Casa:'#Casa',Terreno:'#Terreno','Local comercial':'#LocalComercial',Oficina:'#Oficina','Depósito':'#Deposito'};
  if(typeTags[d.type])tags.push(typeTags[d.type]);
  if(/paso de los toros/i.test(d.zone))tags.push('#PasoDeLosToros');
  lines.push(tags.join(' '));return lines.join('\n\n');
 }

 return {initial,parse,features,copy};
})();
