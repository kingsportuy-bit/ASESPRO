"""Puente explícito panel → catálogo web. Credencial cifrada con DPAPI."""
import base64,json,os,re,urllib.request,urllib.error,urllib.parse
from pathlib import Path
from ia_local import crypt
STORE=Path(os.environ.get('LOCALAPPDATA',str(Path.home())))/'ASESPRO'/'web-publicacion.dpapi'
DEFAULT_URL='https://inmobiliaria.asespro.com.uy'
def settings():
 if not STORE.exists():raise ValueError('Conectá la web en Configurar conexión web antes de publicar.')
 return json.loads(crypt(STORE.read_bytes(),True).decode())
def status():
 if not STORE.exists():return {'configured':False,'url':DEFAULT_URL}
 return {'configured':True,'url':settings()['url']}
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
class WebConnectionError(ValueError):
 unconfirmed=True
def remote(config,method,payload=None,media=None):
 url=config['url']+('/api/panel-web' if media is None else media)
 req=urllib.request.Request(url,data=json.dumps(payload,ensure_ascii=False).encode() if payload is not None else None,headers={'Authorization':'Bearer '+config['key'],'Content-Type':'application/json','Accept':'application/json' if media is None else 'image/jpeg','User-Agent':'ASESPRO-Panel/1.0'},method=method)
 try:
  with urllib.request.build_opener(NoRedirect).open(req,timeout=45) as response:
   body=response.read(21*1024*1024)
   return body if media else json.loads(body)
 except urllib.error.HTTPError as error:
  if error.code in [401,403]:raise ValueError('La web rechazó la conexión. Revisá la clave de publicación.') from None
  try:message=json.loads(error.read(4096)).get('error','La web no completó la solicitud.')
  except Exception:message='La web no completó la solicitud (HTTP '+str(error.code)+').'
  raise ValueError(message) from None
 except (urllib.error.URLError,TimeoutError):raise WebConnectionError('No hubo respuesta de la web. Los datos del editor se conservan; comprobá si se publicó antes de reintentar.') from None
def configure(raw):
 url=str(raw.get('url','')).strip().rstrip('/');parsed=urllib.parse.urlsplit(url)
 if parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path or not (parsed.scheme=='https' and parsed.hostname in ['inmobiliaria.asespro.com.uy','inmobiliaria.asespro.kodebix.com','asespro.codexa.uy'] or parsed.scheme=='http' and parsed.hostname in ['127.0.0.1','localhost']):raise ValueError('Usá el dominio de Inmobiliaria ASESPRO o localhost para pruebas.')
 key=str(raw.get('key','')).strip()
 if not key:
  old=settings()
  if old['url']!=url:raise ValueError('Ingresá la clave de publicación de esa web.')
  key=old['key']
 if not re.fullmatch(r'[A-Za-z0-9_-]{32,128}',key):raise ValueError('Ingresá una clave de publicación web válida.')
 config={'url':url,'key':key};remote(config,'GET')
 STORE.parent.mkdir(parents=True,exist_ok=True);tmp=STORE.with_suffix('.tmp');tmp.write_bytes(crypt(json.dumps(config).encode()));os.replace(tmp,STORE)
 return status()
def handle(action,raw):
 if action=='status':return status()
 if action=='config':return configure(raw)
 config=settings()
 if action=='list':return remote(config,'GET')
 if action in ['beginVideo','appendVideo']:return remote(config,'POST',{**raw,'action':action})
 if action=='publish':
  if raw.get('reviewed') is not True:raise ValueError('Revisá la publicación web antes de enviarla.')
  return remote(config,'POST',{**raw,'action':'publish'})
 if action=='withdraw':return remote(config,'POST',{'action':'withdraw','id':raw.get('id'),'version':raw.get('version')})
 if action=='load':
  item=next((x for x in remote(config,'GET')['items'] if x['id']==raw.get('id')),None)
  if not item:raise ValueError('La propiedad ya no existe en el catálogo.')
  photos=[]
  if item['active']:
   for url in item['property']['photoUrls']:
    if not re.fullmatch(r'/api/panel-web/media/web-[a-f0-9-]{36}/\d+/\d{1,2}\.jpg',url):raise ValueError('Ruta de foto inválida.')
    photos.append(base64.b64encode(remote(config,'GET',media=url)).decode())
  return {'item':item,'photos':photos}
 raise ValueError('Acción web inválida.')
