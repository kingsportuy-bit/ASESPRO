import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir, readFile, writeFile, rename, rm, open, stat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validatePublication, WEB_ID, type Publication } from './panelWebModel';

const CHUNK_SIZE=2*1024*1024;
const UPLOAD_ID=/^[0-9a-f-]{36}$/;
type VideoUpload={id:string;size:number;chunks:number};
function uploadPath(id:string,uploadId:string){checkId(id);if(!UPLOAD_ID.test(uploadId))throw Error('Video inválido.');return path.join(root(),'uploads',id,uploadId);}
export async function beginVideo(id:string,size:number){checkId(id);if(!Number.isSafeInteger(size)||size<12||size>250*1024*1024)throw Error('Video inválido: máximo 250 MB.');const uploadId=randomUUID(),folder=uploadPath(id,uploadId);await mkdir(folder,{recursive:true});const metadata:VideoUpload={id,size,chunks:Math.ceil(size/CHUNK_SIZE)};await writeFile(path.join(folder,'upload.json'),JSON.stringify(metadata));return {uploadId,...metadata};}
export async function appendVideo(id:string,uploadId:string,index:number,data:Buffer){const folder=uploadPath(id,uploadId),metadata=JSON.parse(await readFile(path.join(folder,'upload.json'),'utf8')) as VideoUpload;if(!Number.isInteger(index)||index<0||index>=metadata.chunks||data.length!==Math.min(CHUNK_SIZE,metadata.size-index*CHUNK_SIZE))throw Error('Fragmento de video inválido.');if(index===0&&data.toString('ascii',4,8)!=='ftyp')throw Error('Video inválido: exportá MP4 desde el panel.');const target=path.join(folder,index+'.part'),tmp=target+'.'+randomUUID();try{await writeFile(tmp,data);await rename(tmp,target);}finally{await rm(tmp,{force:true});}return {index};}
async function assembleVideo(id:string,uploadId:string,target:string){const folder=uploadPath(id,uploadId),metadata=JSON.parse(await readFile(path.join(folder,'upload.json'),'utf8')) as VideoUpload;const file=await open(target,'wx');try{for(let index=0;index<metadata.chunks;index++){const chunk=await readFile(path.join(folder,index+'.part'));if(chunk.length!==Math.min(CHUNK_SIZE,metadata.size-index*CHUNK_SIZE))throw Error('Video incompleto. Reintentá la publicación.');await file.writeFile(chunk);}}finally{await file.close();}if((await stat(target)).size!==metadata.size)throw Error('Video incompleto.');}

function root(){return process.env.PANEL_WEB_DATA_DIR || path.join(process.cwd(),'.panel-web-data');}
function checkId(id:string){if(!WEB_ID.test(id))throw Error('Referencia inválida.');}
function isMissing(error:unknown){return (error as NodeJS.ErrnoException).code==='ENOENT';}
async function read(id:string):Promise<Publication|null>{checkId(id);try{return JSON.parse(await readFile(path.join(root(),id+'.json'),'utf8')) as Publication;}catch(error){if(isMissing(error))return null;throw error;}}
export async function getPublication(id:string){const item=await read(id);return item?.active?item:null;}
export async function listPublications(includeInactive=false):Promise<Publication[]>{
 let names:string[];try{names=await readdir(root());}catch(error){if(isMissing(error))return [];throw error;}
 const items=await Promise.all(names.filter(n=>n.endsWith('.json')&&WEB_ID.test(n.slice(0,-5))).map(n=>read(n.slice(0,-5))));
 return items.filter((item):item is Publication=>!!item&&(includeInactive||item.active)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
async function locked<T>(id:string,action:()=>Promise<T>):Promise<T>{
 checkId(id);await mkdir(root(),{recursive:true});const lock=path.join(root(),id+'.lock');
 try{await mkdir(lock);}catch(error){if((error as NodeJS.ErrnoException).code==='EEXIST')throw Error('Esta propiedad se está actualizando. Reintentá en unos segundos.');throw error;}
 try{return await action();}finally{await rm(lock,{recursive:true,force:true});}
}
async function commit(item:Publication){const target=path.join(root(),item.id+'.json'),tmp=target+'.'+randomUUID()+'.tmp';try{await writeFile(tmp,JSON.stringify(item));await rename(tmp,target);}finally{await rm(tmp,{force:true});}}
export async function savePublication(input:unknown,photos:Buffer[]):Promise<Publication>{
 const item=validatePublication(input);
 const video=(input as {videoUploadId?:unknown;keepVideo?:unknown;carouselComplete?:unknown});
 item.carouselComplete=video.carouselComplete===true;
 if(video.videoUploadId!==undefined&&typeof video.videoUploadId!=='string')throw Error('Video inválido.');
 if(!photos.length||photos.length>20||photos.reduce((n,p)=>n+p.length,0)>14*1024*1024||photos.some(p=>p.length>1024*1024||p.length<4||p[0]!==255||p[1]!==216||p[2]!==255||p[p.length-2]!==255||p[p.length-1]!==217))throw Error('Cargá entre 1 y 20 fotos JPEG, hasta 1 MB cada una y 14 MB en total.');
 return locked(item.id,async()=>{
  const previous=await read(item.id);
  if((input as {featured?:unknown}).featured===undefined&&previous)item.property.isFeatured=previous.property.isFeatured===true;
  if((previous?.version??0)!==item.version)throw Error('Hay una versión más reciente. Cargá la propiedad desde el catálogo antes de actualizar.');
  item.version++;const folder=path.join(root(),item.id,String(item.version));await mkdir(folder,{recursive:true});
  try{
   await Promise.all(photos.map((photo,i)=>writeFile(path.join(folder,i+'.jpg'),photo)));
   item.property.photoUrls=photos.map((_,i)=>`/api/panel-web/media/${item.id}/${item.version}/${i}.jpg`);
   if(video.videoUploadId){await assembleVideo(item.id,video.videoUploadId as string,path.join(folder,'video.mp4'));item.property.videoUrl=`/api/panel-web/media/${item.id}/${item.version}/video.mp4`;}
   else if(video.keepVideo===true&&previous?.property.videoUrl){
    const source=await open(path.join(root(),item.id,String(previous.version),'video.mp4'),'r');const target=await open(path.join(folder,'video.mp4'),'wx');
    try{for await(const chunk of source.createReadStream({autoClose:false}))await target.writeFile(chunk);}finally{await source.close();await target.close();}
    item.property.videoUrl=`/api/panel-web/media/${item.id}/${item.version}/video.mp4`;
   }
   if(item.property.videoUrl&&photos.length>19)throw Error('El carrusel admite hasta 20 archivos entre fotos y video.');
   await commit(item);
  }catch(error){await rm(folder,{recursive:true,force:true});throw error;}
  // Keep former versions on disk for rollback/backups; the media endpoint serves only the active version.
  return item;
 });
}
export async function videoFile(id:string,version:string){checkId(id);if(!/^\d+$/.test(version))throw Error('Video inválido.');const item=await getPublication(id);if(!item||String(item.version)!==version||item.property.videoUrl!==`/api/panel-web/media/${id}/${version}/video.mp4`)throw Error('Video no disponible.');return path.join(root(),id,version,'video.mp4');}
export async function withdrawPublication(id:string,version:number){return locked(id,async()=>{const item=await read(id);if(!item||item.version!==version)throw Error('La versión cambió. Actualizá el catálogo.');item.active=false;item.version++;item.updatedAt=new Date().toISOString();await commit(item);return item;});}
export async function readPhoto(id:string,version:string,name:string){
 checkId(id);if(!/^\d+$/.test(version)||!/^\d{1,2}\.jpg$/.test(name))throw Error('Foto inválida.');
 const item=await getPublication(id);if(!item||String(item.version)!==version||!item.property.photoUrls.includes(`/api/panel-web/media/${id}/${version}/${name}`))throw Error('Foto no disponible.');
 return readFile(path.join(root(),id,version,name));
}

const frameJobs=new Map<string,Promise<Buffer>>();
export async function readVideoFrame(id:string,version:string,name:string):Promise<Buffer>{
 if(name!=='poster.jpg'&&name!=='preview.jpg')throw Error('Vista inválida.');
 const source=await videoFile(id,version),target=path.join(path.dirname(source),name);
 try{return await readFile(target);}catch(error){if(!isMissing(error))throw error;}
 let job=frameJobs.get(target);
 if(!job){job=(async()=>{const tmp=target+'.'+randomUUID()+'.jpg';try{
  const run=promisify(execFile);
  try{await run('ffmpeg',['-hide_banner','-loglevel','error','-ss',name==='poster.jpg'?'2':'8','-i',source,'-frames:v','1','-vf','scale=720:-2','-q:v','3','-y',tmp],{timeout:30000});await stat(tmp);}catch{await run('ffmpeg',['-hide_banner','-loglevel','error','-i',source,'-frames:v','1','-vf','scale=720:-2','-q:v','3','-y',tmp],{timeout:30000});}
  await rename(tmp,target);return await readFile(target);
 }finally{await rm(tmp,{force:true});}})();frameJobs.set(target,job);}
 try{return await job;}finally{frameJobs.delete(target);}
}
