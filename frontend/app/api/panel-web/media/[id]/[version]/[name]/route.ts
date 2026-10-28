import { readPhoto } from '@/lib/panelWebStore';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:{id:string;version:string;name:string}}){try{const photo=await readPhoto(params.id,params.version,params.name);return new Response(new Uint8Array(photo),{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Foto no disponible',{status:404,headers:{'Cache-Control':'no-store'}});}}
