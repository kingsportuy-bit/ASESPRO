from pathlib import Path
from datetime import datetime,timezone,timedelta
import sys,json,shutil,xml.etree.ElementTree as ET
sys.path.insert(0,str(Path.home()/'.codex/tmp/asespro-font-tools'))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
from marca import ROOT,brief,logos
NS='http://www.w3.org/2000/svg';ET.register_namespace('',NS)
c=json.loads((ROOT/'CONFIG_MARCA.json').read_text(encoding='utf-8'))
if c.get('logoDescriptor')=='INMOBILIARIA':
 raise SystemExit('La adaptación de logos ya está aplicada. No se repite.')
stamp=datetime.now(timezone(timedelta(hours=-3))).isoformat(timespec='seconds')
archive=ROOT/'old'/f'v{c["version"]:03d}_{stamp[:19].replace(":","-")}'
archive.mkdir(parents=True)
for name in ['BRIEF_MARCA.md','CONFIG_MARCA.json']:shutil.copy2(ROOT/name,archive/name)
shutil.copytree(ROOT/'assets/logos',archive/'logos')
font=TTFont(ROOT/'assets/fonts/Switzer_Complete/Fonts/OTF/Switzer-Regular.otf')
glyphs=font.getGlyphSet();cmap=font.getBestCmap();text='INMOBILIARIA'
advance=sum(glyphs[cmap[ord(ch)]].width for ch in text)
all_bounds=BoundsPen(glyphs);cursor=0
for ch in text:
 g=glyphs[cmap[ord(ch)]];g.draw(TransformPen(all_bounds,(1,0,0,1,cursor,0)));cursor+=g.width
tx0,ty0,tx1,ty1=all_bounds.bounds
output={}
for kind in ['vertical','horizontal','mobile']:
 path=ROOT/'assets/logos'/f'{kind}.svg';r=ET.parse(path).getroot()
 for parent in r.iter():
  for el in list(parent):
   if 'data-text' in el.attrib or el.attrib.get('id','').startswith('font_'):parent.remove(el)
 if kind!='mobile':
  group=next(x for x in r if x.tag==f'{{{NS}}}g')
  paths=[x for x in group if x.tag==f'{{{NS}}}path']
  bounds=BoundsPen(None)
  for el in paths[6:]:
   matrix=[float(x) for x in el.attrib['transform'][7:-1].split(',')]
   parse_path(el.attrib['d'],TransformPen(bounds,tuple(matrix)))
  x0,y0,x1,y1=bounds.bounds
  target=(x1-x0)*(1.08 if kind=='vertical' else 1.0);scale=target/(tx1-tx0)
  left=(x0+x1-target)/2;top=y1+(y1-y0)*.20
  baseline=top+ty1*scale;cursor=0;pen=SVGPathPen(glyphs)
  for ch in text:
   g=glyphs[cmap[ord(ch)]];g.draw(TransformPen(pen,(scale,0,0,-scale,left+(cursor-tx0)*scale,baseline)));cursor+=g.width
  el=ET.SubElement(group,f'{{{NS}}}path',{'d':pen.getCommands(),'fill':'var(--logo-ink, #003F31)','data-original-fill':'#003F31','class':'logo-main','data-label':'INMOBILIARIA','data-font':'Switzer Regular'})
  width=float(r.attrib['width']);minx=min(0,left-2);maxx=max(width,left+target+2)
  height=max(float(r.attrib['height']),baseline-ty0*scale+2)
  r.set('viewBox',f'{minx} 0 {maxx-minx} {height}');r.set('width',str(maxx-minx));r.set('height',str(height))
 r.set('aria-label','ASESPRO INMOBILIARIA' if kind!='mobile' else 'Símbolo ASESPRO')
 output[kind]=ET.tostring(r,encoding='unicode');path.write_text(output[kind],encoding='utf-8')
(ROOT/'assets/logos/logos.json').write_text(json.dumps(output,ensure_ascii=False),encoding='utf-8')
# PDFs originales se conservan exclusivamente en el respaldo histórico.
for p in (ROOT/'assets/logos').glob('*.pdf'):shutil.move(str(p),str(archive/p.name))
c['version']+=1;c['updatedAt']=stamp;c['logoDescriptor']='INMOBILIARIA';c['logoDescriptorFont']='Switzer Regular (curvas)'
(ROOT/'CONFIG_MARCA.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
template=ROOT/'herramientas/brief.template.md'
s=template.read_text(encoding='utf-8').replace('Los tres logos son vectores originales, transparentes y recoloreables.', 'Los tres logos son vectores transparentes y recoloreables. Las versiones normal y horizontal conservan el símbolo y las letras originales de ASESPRO y llevan **INMOBILIARIA** debajo, en Switzer Regular convertida a curvas. La frase anterior «Asesoramiento Profesional para Empresas» queda retirada. El isologo es únicamente el símbolo.').replace('y los PDFs originales como respaldo','vigentes; las fuentes anteriores quedan únicamente en old/ como respaldo histórico').replace('tres variantes, dos contextos, PDFs originales','tres variantes vigentes y dos contextos de color')
template.write_text(s,encoding='utf-8')
(ROOT/'BRIEF_MARCA.md').write_text(brief(c),encoding='utf-8');logos(c)
readme=ROOT/'LEEME.md';s=readme.read_text(encoding='utf-8').replace('vectores recoloreables, versiones por fondo y PDFs originales','vectores recoloreables vigentes con INMOBILIARIA en Switzer Regular, versiones por fondo. Los PDFs anteriores se conservan en old/');readme.write_text(s,encoding='utf-8')
print('Logos actualizados; brief v'+str(c['version'])+'; anteriores en '+str(archive))
