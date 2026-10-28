import { useEffect } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Property } from '../types';

export function usePropertyAreas(map:LeafletMap|null,properties:Property[],highlightedId?:string,onClick?:(property:Property)=>void){
 useEffect(()=>{
  if(!map)return;
  let cancelled=false;
  const layers:import('leaflet').Circle[]=[];
  void import('leaflet').then(L=>{
   if(cancelled)return;
   for(const property of properties){
    if(!property.approximateRadius)continue;
    const selected=property.id===highlightedId;
    const circle=L.circle([property.lat,property.lng],{radius:property.approximateRadius,color:selected?'#005d22':'#009335',weight:selected?4:2,fillOpacity:selected?.3:.15}).addTo(map);
    const popup=document.createElement('div'),title=document.createElement('strong'),note=document.createElement('p'),link=document.createElement('a');
    title.textContent=property.title||'Propiedad ASESPRO';note.textContent='Zona aproximada';link.textContent='Ver propiedad';link.href='/propiedad/'+encodeURIComponent(property.id);popup.append(title,note,link);
    circle.bindPopup(popup,{maxWidth:260});
    circle.on('click',()=>onClick?.(property));
    const element=circle.getElement();
    if(element){element.setAttribute('tabindex','0');element.setAttribute('role','button');element.setAttribute('aria-label',`Ver zona aproximada de ${property.title||property.id}`);element.addEventListener('keydown',event=>{const key=(event as KeyboardEvent).key;if(key==='Enter'||key===' '){event.preventDefault();circle.openPopup();onClick?.(property);}});}
    layers.push(circle);
   }
  });
  return()=>{cancelled=true;layers.forEach(layer=>layer.remove());};
 },[map,properties,highlightedId,onClick]);
}
