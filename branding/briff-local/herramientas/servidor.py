from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from datetime import datetime,timezone,timedelta
import json,secrets,threading,shutil,os,base64,webbrowser,re,runpy,sys
from marca import ROOT,brief,logos
import video_local,ia_local
TOKEN=secrets.token_urlsafe(32);LOCK=threading.Lock();PORT=8767
def atomic(path,text):
 tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(text,encoding='utf-8');os.replace(tmp,path)
def clean(raw):
 c=json.loads((ROOT/'CONFIG_MARCA.json').read_text(encoding='utf-8'))
 for k in c['colors']:
  if not re.fullmatch(r'#[0-9A-Fa-f]{6}',str(raw['colors'][k])):raise ValueError('Color inválido')
  c['colors'][k]=raw['colors'][k].upper()
 for ctx in ['dark','light']:
  v=raw['logoConfigs'][ctx]['variant']
  if v not in ['mobile','vertical','horizontal']:raise ValueError('Logo inválido')
  c['logoConfigs'][ctx]['variant']=v
  for k in ['mobile','vertical','horizontal']:
   color=raw['logoConfigs'][ctx]['variants'][k]['color']
   if not re.fullmatch(r'#[0-9A-Fa-f]{6}',color):raise ValueError('Color inválido')
   c['logoConfigs'][ctx]['variants'][k]['color']=color.upper()
  c['logoConfigs'][ctx]['color']=c['logoConfigs'][ctx]['variants'][v]['color']
 for k,choices in {'theme':['dark','light'],'background':['solid','gradient'],'style':['regular','bold','duotone','fill']}.items():
  if raw[k] not in choices:raise ValueError('Opción inválida')
  c[k]=raw[k]
 catalog=json.loads((ROOT/'assets/iconos/catalogo.json').read_text(encoding='utf-8'))
 if raw['icon'] not in catalog:raise ValueError('Símbolo inválido')
 c['icon']=raw['icon']
 for k,lo,hi in [('weight',600,900),('typeSize',80,124),('iconSize',260,520),('angle',-25,25)]:c[k]=int(max(lo,min(hi,float(raw[k]))))
 for k,n in [('title',85),('support',110)]:c[k]=str(raw[k])[:n]
 c['safe']=bool(raw.get('safe'));return c
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
 def reply(self,data,status=200):
  b=json.dumps(data,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
 def do_GET(self):
  if self.headers.get('Host') not in [f'127.0.0.1:{PORT}',f'localhost:{PORT}']:return self.reply({'error':'Host inválido'},403)
  if self.path=='/api/current':return self.reply({'config':json.loads((ROOT/'CONFIG_MARCA.json').read_text(encoding='utf-8')),'token':TOKEN,'history':sorted(p.name for p in (ROOT/'old').iterdir() if p.is_dir())})
  if self.path.startswith('/api/video/status/'):
   try:return self.reply(video_local.status(self.path.rsplit('/',1)[1]))
   except ValueError as e:return self.reply({'error':str(e)},404)
  if self.path.startswith('/api/video/file/'):
   item=video_local.JOBS.get(self.path.rsplit('/',1)[1])
   if not item or item['state']!='done':return self.reply({'error':'Video no disponible'},404)
   path=Path(item['path']);self.send_response(200);self.send_header('Content-Type','video/mp4');self.send_header('Content-Length',str(path.stat().st_size));self.send_header('Content-Disposition','attachment; filename="ASESPRO-video.mp4"');self.end_headers()
   with path.open('rb') as f:shutil.copyfileobj(f,self.wfile)
   return
  if self.path=='/':self.path='/SISTEMA_VISUAL.html'
  super().do_GET()
 def do_POST(self):
  if self.headers.get('Origin')!=f'http://127.0.0.1:{PORT}' or self.headers.get('X-Asespro-Token')!=TOKEN:return self.reply({'error':'Acceso no autorizado'},403)
  if self.headers.get('Host')!=f'127.0.0.1:{PORT}':return self.reply({'error':'Host inválido'},403)
  try:
   n=int(self.headers.get('Content-Length','0'))
   if self.path=='/api/video/upload':return self.reply(video_local.upload(self.rfile,n))
   if n<1 or n>20000000:raise ValueError('Tamaño inválido')
   raw=json.loads(self.rfile.read(n))
   if self.path=='/api/ai/status':return self.reply(ia_local.status(raw.get("check") is True))
   if self.path=='/api/ai/config':return self.reply(ia_local.configure(raw))
   if self.path=='/api/ai/generate':return self.reply(ia_local.generate(raw))
   if self.path=='/api/video/render':return self.reply(video_local.render(raw))
   with LOCK:
    if self.path=='/api/brief':
     c=clean(raw);old=json.loads((ROOT/'CONFIG_MARCA.json').read_text(encoding='utf-8'));changed=c!=old
     if changed:
      stamp=datetime.now(timezone(timedelta(hours=-3))).isoformat(timespec='seconds');folder=ROOT/'old'/f'v{old["version"]:03d}_{stamp[:19].replace(":","-")}'
      folder.mkdir();shutil.copy2(ROOT/'BRIEF_MARCA.md',folder/'BRIEF_MARCA.md');shutil.copy2(ROOT/'CONFIG_MARCA.json',folder/'CONFIG_MARCA.json')
      shutil.copytree(ROOT/'assets/logos',folder/'logos')
      c['version']=old['version']+1;c['updatedAt']=stamp
      atomic(ROOT/'CONFIG_MARCA.json',json.dumps(c,ensure_ascii=False,indent=2));atomic(ROOT/'BRIEF_MARCA.md',brief(c));logos(c)
      runpy.run_path(str(ROOT/'herramientas/compilar.py'))
     return self.reply({'config':c,'brief':brief(c),'changed':changed})
    if self.path=='/api/idea':
     kind=raw['kind']
     if kind not in ['post','story']:raise ValueError('Formato inválido')
     png=base64.b64decode(raw['png'],validate=True)
     if not png.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('PNG inválido')
     folder=ROOT/'ideas'/(datetime.now().strftime('%Y%m%d-%H%M%S')+'-'+kind+'-'+secrets.token_hex(2));folder.mkdir()
     (folder/'referencia.png').write_bytes(png);(folder/'PROMPT.md').write_text(str(raw['prompt']),encoding='utf-8');(folder/'config.json').write_text(json.dumps(raw['config'],ensure_ascii=False,indent=2),encoding='utf-8')
     for name in ['logo.svg','simbolo.svg']:
      if isinstance(raw.get(name),str):(folder/name).write_text(raw[name],encoding='utf-8')
     return self.reply({'folder':str(folder.relative_to(ROOT))})
    return self.reply({'error':'Ruta inválida'},404)
  except Exception as e:return self.reply({'error':str(e)},400)
if __name__=='__main__':
 server=ThreadingHTTPServer(('127.0.0.1',PORT),Handler)
 if '--sin-abrir' not in sys.argv:webbrowser.open(f'http://127.0.0.1:{PORT}')
 server.serve_forever()
