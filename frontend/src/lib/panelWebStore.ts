import { mkdir, readdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validatePublication, WEB_ID, type Publication } from './panelWebModel';

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
 if(!photos.length||photos.length>19||photos.reduce((n,p)=>n+p.length,0)>14*1024*1024||photos.some(p=>p.length>1024*1024||p.length<4||p[0]!==255||p[1]!==216||p[2]!==255||p[p.length-2]!==255||p[p.length-1]!==217))throw Error('Cargá entre 1 y 19 fotos JPEG, hasta 1 MB cada una y 14 MB en total.');
 return locked(item.id,async()=>{
  const previous=await read(item.id);
  if((previous?.version??0)!==item.version)throw Error('Hay una versión más reciente. Cargá la propiedad desde el catálogo antes de actualizar.');
  item.version++;const folder=path.join(root(),item.id,String(item.version));await mkdir(folder,{recursive:true});
  try{
   await Promise.all(photos.map((photo,i)=>writeFile(path.join(folder,i+'.jpg'),photo)));
   item.property.photoUrls=photos.map((_,i)=>`/api/panel-web/media/${item.id}/${item.version}/${i}.jpg`);
   await commit(item);
  }catch(error){await rm(folder,{recursive:true,force:true});throw error;}
  // Keep former versions on disk for rollback/backups; the media endpoint serves only the active version.
  return item;
 });
}
export async function withdrawPublication(id:string,version:number){return locked(id,async()=>{const item=await read(id);if(!item||item.version!==version)throw Error('La versión cambió. Actualizá el catálogo.');item.active=false;item.version++;item.updatedAt=new Date().toISOString();await commit(item);return item;});}
export async function readPhoto(id:string,version:string,name:string){
 checkId(id);if(!/^\d+$/.test(version)||!/^\d{1,2}\.jpg$/.test(name))throw Error('Foto inválida.');
 const item=await getPublication(id);if(!item||String(item.version)!==version||!item.property.photoUrls.includes(`/api/panel-web/media/${id}/${version}/${name}`))throw Error('Foto no disponible.');
 return readFile(path.join(root(),id,version,name));
}
