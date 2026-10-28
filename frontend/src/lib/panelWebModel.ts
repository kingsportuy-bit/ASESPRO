import type { PropertyListing, PropertyType } from './properties';

export const PUBLIC_FIELDS = ['operation','type','zone','beds','baths','built','land','garage','wash','patio','pool','balcony','bbq','equipped','water','wifi','cable','expenses','details','woodstove'] as const;
export const WEB_ID = /^web-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export type Publication = { id: string; version: number; active: boolean; updatedAt: string; data: Record<string,string>; area: {lat:number;lng:number;radius:number}; phone:string; property:PropertyListing };
const TYPES: Record<string, PropertyType> = {'Casa':'casa','Apartamento':'apartamento','Terreno':'terreno','Local comercial':'local','Oficina':'oficina','Depósito':'deposito'};
const PRIVATE_TEXT = /(?:US\$|U\$S|USD|UYU|\$|€)\s*[\d.,]+|\b(?:precio|direcci[oó]n|calle|avenida|bulevar|esquina|apto\.?\s*\d|unidad\s*\d)\b|\b(?:av|bvar)\.?\s+\w|\b\d{3,}\s*(?:pesos|d[oó]lares)\b/i;
function record(value: unknown): Record<string,unknown> { if(!value || typeof value!=='object' || Array.isArray(value)) throw Error('Datos inválidos.');return value as Record<string,unknown>; }
export function validatePublication(value:unknown): Publication {
 const input=record(value), raw=record(input.data), area=record(input.area);
 if(typeof input.id!=='string'||!WEB_ID.test(input.id))throw Error('Referencia inválida.');
 if(!Number.isInteger(input.version)||Number(input.version)<0)throw Error('Versión inválida.');
 if(input.reviewed!==true)throw Error('Revisá los datos públicos y la zona antes de publicar.');
 const data:Record<string,string>={};
 for(const key of PUBLIC_FIELDS){const v=raw[key]??'';if(typeof v!=='string'||v.length>(key==='details'?900:80))throw Error('Revisá el campo '+key);data[key]=v.trim();}
 if(!['VENTA','ALQUILER','ALQUILER TEMPORAL'].includes(data.operation)||!TYPES[data.type])throw Error('Indicá operación y tipo.');
 const detailNumbers=data.details.replace(/\b\d+(?:[.,]\d+)?\s*(?:m²|m2|metros(?: cuadrados)?|dormitorios?|baños?|ambientes?|plantas?|pisos?)\b/gi,'');
 if(!data.zone||/\d/.test(data.zone)||PRIVATE_TEXT.test(data.zone+' '+data.details)||/\b\d{2,}\b/.test(detailNumbers)||/https?:\/\/|www\.|@/.test(data.details))throw Error('Quitá precios, calles y direcciones del texto público.');
 for(const key of ['garage','wash','patio','pool','balcony','bbq','equipped','water','wifi','cable','woodstove'])if(!['','yes','no'].includes(data[key]))throw Error('Característica inválida.');
 if(!['','yes','none','included'].includes(data.expenses))throw Error('Gastos comunes inválidos.');
 for(const key of ['beds','baths','built','land'])if(data[key]!==''&&(!/^\d+(?:\.\d{1,2})?$/.test(data[key])||Number(data[key])>10000000||(['beds','baths'].includes(key)&&(!Number.isInteger(Number(data[key]))||Number(data[key])>99))))throw Error('Cantidad inválida: '+key);
 const {lat,lng,radius}=area;
 if(typeof lat!=='number'||typeof lng!=='number'||typeof radius!=='number'||!Number.isFinite(lat)||!Number.isFinite(lng)||!Number.isFinite(radius)||lat< -35.5||lat> -30||lng< -58.5||lng> -53||radius<50||radius>3000)throw Error('Elegí una zona de Uruguay y un radio entre 50 y 3000 metros.');
 if(typeof input.phone!=='string'||!/^598\d{8}$/.test(input.phone))throw Error('WhatsApp: ingresá 598 y los 8 dígitos del número.');
 const title=`${data.type}${data.beds!==''?(Number(data.beds)===0?' · monoambiente':` de ${data.beds} dormitorios`):''} en ${data.zone}`;
 const extras:Record<string,string>={garage:'Cochera',wash:'Lavadero',patio:'Patio',pool:'Piscina',balcony:'Balcón',bbq:'Parrillero',woodstove:'Estufa a leña',equipped:'Equipado',water:'Agua incluida',wifi:'Wi-Fi incluido',cable:'TV cable incluido'};
 const details=[data.details,...Object.entries(extras).filter(([key])=>data[key]==='yes').map(([,label])=>label),data.land?`${data.land} m² de terreno`:null,({'yes':'Con gastos comunes','none':'Sin gastos comunes','included':'Gastos comunes incluidos'} as Record<string,string>)[data.expenses]].filter(Boolean).join('. ');
 return {id:input.id,version:Number(input.version),active:true,updatedAt:new Date().toISOString(),data,area:{lat,lng,radius},phone:input.phone,property:{id:input.id,title,description:details,location:data.zone,type:TYPES[data.type],operation:data.operation==='VENTA'?'venta':'alquiler',lat,lng,approximateRadius:radius,contactPhone:input.phone,hidePrice:true,bedrooms:data.beds===''?undefined:Number(data.beds),bathrooms:data.baths===''?undefined:Number(data.baths),areaM2:data.built===''?undefined:Number(data.built),amenities:{garage:data.garage==='yes',laundry:data.wash==='yes',patio:data.patio==='yes',pool:data.pool==='yes',balcony:data.balcony==='yes'},status:'activo',photoUrls:[]}};
}
