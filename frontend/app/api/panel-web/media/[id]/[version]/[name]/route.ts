import { readPhoto, videoFile } from '@/lib/panelWebStore';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:{id:string;version:string;name:string}}){try{
 if(params.name==='video.mp4'){
  const file=await videoFile(params.id,params.version),{size}=await stat(file),range=request.headers.get('range');
  const headers:Record<string,string>={'Content-Type':'video/mp4','Cache-Control':'no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
  let start=0,end=size-1;
  if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});if(!match[1])start=Math.max(0,size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}if(start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});headers['Content-Range']=`bytes ${start}-${end}/${size}`;}
  headers['Content-Length']=String(end-start+1);
  return new Response(Readable.toWeb(createReadStream(file,{start,end})) as ReadableStream,{status:range?206:200,headers});
 }
 const photo=await readPhoto(params.id,params.version,params.name);return new Response(new Uint8Array(photo),{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Archivo no disponible',{status:404,headers:{'Cache-Control':'no-store'}});}}
