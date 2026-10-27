from pathlib import Path
import subprocess,shutil,json,secrets,threading,base64,math
from marca import ROOT
CACHE=ROOT/'.video-trabajos';CACHE.mkdir(exist_ok=True)
JOBS={};RENDER_LOCK=threading.Lock()
def executable(name):
 path=shutil.which(name)
 if not path:raise ValueError('No se encontró '+name+'. Instalá FFmpeg y reiniciá el panel.')
 return path
def upload(stream,length):
 if length<1 or length>250*1024*1024:raise ValueError('Video máximo: 250 MB.')
 id=secrets.token_hex(16);folder=CACHE/id;folder.mkdir();source=folder/'original.video'
 with source.open('wb') as target:
  remaining=length
  while remaining:
   chunk=stream.read(min(1024*1024,remaining))
   if not chunk:raise ValueError('Carga incompleta.')
   target.write(chunk);remaining-=len(chunk)
 result=subprocess.run([executable('ffprobe'),'-v','error','-show_format','-show_streams','-of','json',str(source)],capture_output=True,timeout=45,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 if result.returncode:raise ValueError('No se pudo leer el video. Usá MP4, MOV o WebM.')
 info=json.loads(result.stdout);video=next((s for s in info['streams'] if s['codec_type']=='video'),None)
 duration=float(info['format'].get('duration',0))
 if not video or not math.isfinite(duration) or not 0<duration<=3600 or max(video['width'],video['height'])>8192:raise ValueError('Video no compatible: máximo 60 minutos y 8192 px por lado.')
 item={'source':str(source),'duration':duration,'audio':any(s['codec_type']=='audio' for s in info['streams']),'state':'uploaded'};JOBS[id]=item
 return {'id':id,'duration':duration,'audio':item['audio']}
def render(raw):
 source_id=raw.get('id');item=JOBS.get(source_id)
 if not item:raise ValueError('Volvé a cargar el video; la sesión local venció.')
 start,end,speed=map(float,[raw.get('start',0),raw.get('end',item['duration']),raw.get('speed',1)])
 if not all(math.isfinite(v) for v in [start,end,speed]) or not 0<=start<end<=item['duration']+.05 or end-start<.2 or speed not in [.5,1,1.25,1.5,2,3,4]:raise ValueError('Revisá inicio, final y velocidad.')
 if not RENDER_LOCK.acquire(blocking=False):raise ValueError('Ya se está exportando otro video. Esperá a que termine.')
 id=secrets.token_hex(16);folder=CACHE/id;folder.mkdir();JOBS[id]={'state':'rendering','source_id':source_id}
 try:
  with_logo=raw.get('logo') is True;logo=folder/'logo.png'
  if with_logo:
   image=base64.b64decode(raw.get('logoPng',''),validate=True)
   if len(image)>2000000 or not image.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Logo PNG inválido.')
   logo.write_bytes(image)
  width,height=1080,1920 if raw.get('format')=='story' else 1440
  def worker():
   try:
    cmd=[executable('ffmpeg'),'-hide_banner','-loglevel','error','-y','-i',item['source']]
    if with_logo:cmd+=['-i',str(logo)]
    vf=f'[0:v]trim=start={start}:end={end},setpts=(PTS-STARTPTS)/{speed},scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,fps=30[base]'
    if with_logo:vf+=f';[1:v]scale=300:-1[logo];[base][logo]overlay=80:{170 if height==1920 else 70}:format=auto[v]'
    else:vf+=';[base]null[v]'
    audio=item['audio'] and not raw.get('mute',False)
    if audio:
     tempos=[2,speed/2] if speed>2 else [speed]
     vf+=f';[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,'+','.join(f'atempo={x}' for x in tempos)+'[a]'
    cmd+=['-filter_complex',vf,'-map','[v]']
    if audio:cmd+=['-map','[a]','-c:a','aac','-b:a','160k']
    else:cmd+=['-an']
    output=folder/'ASESPRO-video.mp4';cmd+=['-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(output)]
    result=subprocess.run(cmd,capture_output=True,timeout=1800,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    if result.returncode:raise ValueError('No se pudo exportar el video. '+result.stderr.decode(errors='replace')[-350:])
    JOBS[id].update(state='done',path=str(output),duration=(end-start)/speed)
   except Exception as error:JOBS[id].update(state='error',error=str(error))
   finally:RENDER_LOCK.release()
  threading.Thread(target=worker,daemon=True).start();return {'id':id,'state':'rendering'}
 except Exception:
  RENDER_LOCK.release();raise
def status(id):
 item=JOBS.get(id)
 if not item:raise ValueError('Trabajo de video no encontrado.')
 return {k:item[k] for k in ['state','duration','error'] if k in item}
