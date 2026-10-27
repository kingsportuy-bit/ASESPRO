from pathlib import Path
import json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
LABELS={'mobile':'Isologo','vertical':'Normal','horizontal':'Horizontal'}
NAMES={'deep':'Profundo','primary':'Principal','mint':'Menta','paper':'Claro','accent':'Acento'}
def brief(c):
 t=(ROOT/'herramientas/brief.template.md').read_text(encoding='utf-8')
 v={'version':f'v{c.get("version",1):03d}','date':c.get('updatedAt',''),'palette':'| Color | HEX |\n|---|---|\n'+'\n'.join(f'| {NAMES[k]} | {h} |' for k,h in c['colors'].items()),'logos':'| Variante | Fondo oscuro | Fondo claro |\n|---|---|---|\n'+'\n'.join(f'| {label} | {c["logoConfigs"]["dark"]["variants"][k]["color"]} | {c["logoConfigs"]["light"]["variants"][k]["color"]} |' for k,label in LABELS.items()),'darkLogo':LABELS[c['logoConfigs']['dark']['variant']],'lightLogo':LABELS[c['logoConfigs']['light']['variant']],**{k:str(c[k]) for k in ['weight','style','theme','background','typeSize','iconSize','angle']}}
 for k,val in v.items():t=t.replace('{{'+k+'}}',val)
 return t
def logos(c,root=ROOT):
 ET.register_namespace('','http://www.w3.org/2000/svg')
 bases={}
 for k,label in LABELS.items():
  basepath=root/'assets/logos'/f'{k}.svg'
  base=ET.fromstring(basepath.read_text(encoding='utf-8'))
  for el in base.iter():
   if 'data-original-fill' in el.attrib:
    el.set('fill',c['colors']['primary']);el.set('data-original-fill',c['colors']['primary']);el.set('class','logo-main')
  bases[k]=ET.tostring(base,encoding='unicode')
  basepath.write_text(bases[k],encoding='utf-8')
  for ctx in ['dark','light']:
   svg=ET.fromstring(bases[k])
   for el in svg.iter():
    if 'data-original-fill' in el.attrib:el.set('fill',c['logoConfigs'][ctx]['variants'][k]['color'])
   (root/'assets/logos'/f'{label.lower()}-fondo-{ctx}.svg').write_text(ET.tostring(svg,encoding='unicode'),encoding='utf-8')
 (root/'assets/logos/logos.json').write_text(json.dumps(bases,ensure_ascii=False),encoding='utf-8')
if __name__=='__main__':
 c=json.loads((ROOT/'CONFIG_MARCA.json').read_text(encoding='utf-8'))
 (ROOT/'BRIEF_MARCA.md').write_text(brief(c),encoding='utf-8');logos(c)
