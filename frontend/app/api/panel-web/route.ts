import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { listPublications, savePublication, withdrawPublication, beginVideo, appendVideo } from '@/lib/panelWebStore';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function allowed(request:Request){const expected=process.env.PANEL_WEB_PUBLISH_KEY;const received=request.headers.get('authorization')?.replace(/^Bearer /,'');return !!expected&&expected.length>=32&&!!received&&Buffer.byteLength(expected)===Buffer.byteLength(received)&&timingSafeEqual(Buffer.from(expected),Buffer.from(received));}
function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function GET(request:Request){if(!allowed(request))return json({error:'Conexión web no autorizada.'},401);try{return json({items:await listPublications(true)});}catch{return json({error:'No se pudo leer el catálogo web.'},500);}}
export async function POST(request:Request){
 if(!allowed(request))return json({error:'Conexión web no autorizada.'},401);
 try{
  // Bound the actual stream, not just the optional Content-Length header.
  const reader=request.body?.getReader();if(!reader)throw Error('Faltan datos.');const parts:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>20*1024*1024){await reader.cancel();return json({error:'La carga supera 20 MB.'},413);}parts.push(part.value);}
  const input=JSON.parse(Buffer.concat(parts).toString('utf8'));
  if(input.action==='beginVideo')return json(await beginVideo(input.id,input.size));
  if(input.action==='appendVideo'){if(typeof input.chunk!=='string'||input.chunk.length>2800000||!/^[A-Za-z0-9+/]+={0,2}$/.test(input.chunk))throw Error('Video inválido.');return json(await appendVideo(input.id,input.uploadId,input.index,Buffer.from(input.chunk,'base64')));}
  if(input.action==='withdraw'){if(!Number.isInteger(input.version))throw Error('Versión inválida.');return json({item:await withdrawPublication(input.id,input.version)});}
  if(input.action!=='publish'||!Array.isArray(input.photos)||input.photos.length>20)throw Error('Acción inválida.');
  const photos=input.photos.map((photo:unknown)=>{if(typeof photo!=='string'||photo.length>1400000||!/^\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(photo))throw Error('Foto inválida.');return Buffer.from(photo,'base64');});
  return json({item:await savePublication(input,photos)});
 }catch(error){const message=error instanceof Error?error.message:'No se pudo guardar.';const known=/Revis|Quitá|Indicá|Elegí|WhatsApp|inválid|Cargá|versión|actualiz|Característica|Cantidad|Gastos/.test(message);return json({error:known?message:'No se pudo guardar la propiedad. Reintentá.'},known?400:500);}
}
