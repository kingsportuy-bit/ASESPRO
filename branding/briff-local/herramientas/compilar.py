from pathlib import Path
import json,base64
from marca import ROOT,brief,logos
c=json.loads((ROOT/'CONFIG_MARCA.json').read_text(encoding='utf-8'))
icons=json.loads((ROOT/'assets/iconos/catalogo.json').read_text(encoding='utf-8'));ls=json.loads((ROOT/'assets/logos/logos.json').read_text(encoding='utf-8'))
p=ROOT/'panel'
css=(p/'panel.css').read_text(encoding='utf-8')
for token,name in [('__FONT_NORMAL__','Switzer-Variable.woff2'),('__FONT_ITALIC__','Switzer-VariableItalic.woff2')]:css=css.replace(token,'data:font/woff2;base64,'+base64.b64encode((ROOT/'assets/fonts/Switzer_Complete/Fonts/WEB/fonts'/name).read_bytes()).decode())
css+='\n.idea-actions{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}.idea-actions button{font-size:11px;padding:9px}.brand-actions{display:flex;gap:10px;flex-wrap:wrap}.toolbar{flex-wrap:wrap}header .toolbar{max-width:420px}'
css+='\n'+(p/'compositor.css').read_text(encoding='utf-8')+'\n'+(p/'propiedades.css').read_text(encoding='utf-8')
html=(p/'panel.template.html').read_text(encoding='utf-8').replace('BORRADOR EN EDICIÓN','SISTEMA DE MARCA').replace('Laboratorio de identidad','ASESPRO · Sistema visual').replace('Textos de prueba para explorar el sistema; el brief final se define después.','Guía opcional. Descargá cada idea como imagen y prompt, separados del brief.').replace('para el futuro brief','para el brief actualizado').replace('assets/fonts/Switzer_Complete.zip','assets/fonts/Switzer_Complete.zip').replace('ASESPRO · Exploración de identidad. La configuración se guarda como borrador; no se genera un brief final.','ASESPRO · Identidad vigente. Las composiciones son referencias opcionales.')
section='<section class="section"><h2>Brief de marca y versiones</h2><p>Actualizar guarda BRIEF_MARCA.md y CONFIG_MARCA.json; la versión anterior pasa a old/. Las ideas se exportan por separado.</p><div class="brand-actions"><button class="primary" id="update-brief">Actualizar brief y guardar versión</button><button id="export-brief">Exportar brief .md</button><a class="button" href="BRIEF_MARCA.md" download>Descargar brief vigente</a></div><p id="brand-status" role="status" aria-live="polite"></p></section>'
html=html.replace('<section class="section">',section+'<section class="section">',1).replace('<div class="workspace">','<p id="idea-status" class="hint" role="status" aria-live="polite"></p><div class="workspace">',1)
tabs='<nav class="panel-tabs" role="tablist" aria-label="Herramientas de ASESPRO"><button id="tab-identidad" role="tab" aria-controls="identidad-panel" aria-selected="false" tabindex="-1">Sistema visual y brief</button><button id="tab-compositor" role="tab" aria-controls="compositor-panel" aria-selected="true">Armar publicaciones</button><button id="tab-propiedades" role="tab" aria-controls="propiedades-panel" aria-selected="false" tabindex="-1">Propiedades</button></nav>'
html=html.replace('</header>','</header>'+tabs+'<div class="tab-panel" id="identidad-panel" role="tabpanel" aria-labelledby="tab-identidad" hidden>',1)
html=html.replace('<footer>','</div>'+(p/'compositor.html').read_text(encoding='utf-8')+(p/'propiedades.html').read_text(encoding='utf-8').replace('__PROPIEDADES_VIDEO__',(p/'propiedades-video.html').read_text(encoding='utf-8'))+'<footer>',1)
frames=''
for kind,label,cls in [('post','Publicación · 1080 × 1350',''),('story','Historia · 1080 × 1920','story')]:
 frames+=f'<div class="preview"><h3>{label}</h3><div class="frame {cls}"><div class="canvas"><div class="stamp"></div><div class="cat">CATEGORÍA</div><div class="visual"></div><p class="hook"></p><div class="support"></div><div class="web">inmobiliaria.asespro.com.uy</div><div class="safe"></div></div></div><div class="idea-actions">'+''.join(f'<button data-kind="{kind}" data-idea="{mode}">{text}</button>' for mode,text in [('png','Imagen PNG'),('prompt','Prompt .md'),('zip','Idea completa ZIP')])+'</div></div>'
js=(p/'panel.js').read_text(encoding='utf-8').replace('asespro.social.lab.v2','asespro.marca.servicios.v1')+'\nconst BRIEF_TEMPLATE='+json.dumps((ROOT/'herramientas/brief.template.md').read_text(encoding='utf-8'),ensure_ascii=False)+';\n'+(p/'exportaciones.js').read_text(encoding='utf-8')
examples={k:'data:image/png;base64,'+base64.b64encode((ROOT/'assets/compositor-ejemplo'/name).read_bytes()).decode() for k,name in [('bg','fondo.png'),('text','capa-texto.png')]}
js+='\nconst COMPOSITOR_EXAMPLE='+json.dumps(examples)+';\n'+(p/'compositor.js').read_text(encoding='utf-8')
js+='\n'+(p/'propiedades-modelo.js').read_text(encoding='utf-8')+'\n'+(p/'propiedades-video.js').read_text(encoding='utf-8')+'\n'+(p/'propiedades.js').read_text(encoding='utf-8')+'\n'+(p/'navegacion.js').read_text(encoding='utf-8')+'\n'+(p/'sliders.js').read_text(encoding='utf-8')
for k,v in {'__CSS__':css,'__FRAMES__':frames,'__OPTIONS__':''.join(f'<option value="{k}">{v["label"]}</option>' for k,v in icons.items()),'__CATEGORIES__':''.join(f'<option value="{x}">{x}</option>' for x in dict.fromkeys(v['category'] for v in icons.values())),'__CONFIG__':json.dumps(c,ensure_ascii=False),'__ICONS__':json.dumps(icons,ensure_ascii=False),'__LOGOS__':json.dumps(ls,ensure_ascii=False),'__JS__':js}.items():html=html.replace(k,v)
libs=''.join('<script>'+ (p/x).read_text(encoding='utf-8')+'</script>' for x in ['html2canvas.min.js','fflate.js'])
html=html.replace('<script>const INITIAL=',libs+'<script>const INITIAL=')
html=html.replace('</style>', '\n'+(p/'oscuro.css').read_text(encoding='utf-8')+'</style>',1)
(ROOT/'SISTEMA_VISUAL.html').write_text(html,encoding='utf-8')

# Resumen independiente de la misma guía incluida en el brief.
guide=(ROOT/'herramientas/brief.template.md').read_text(encoding='utf-8').split('### Márgenes de seguridad predeterminados',1)[1].split('\n## ',1)[0]
(ROOT/'GUIA_COMPOSICION.md').write_text('# ASESPRO · Guía opcional de composición\n\nVersión de marca v'+str(c['version']).zfill(3)+'\n\n## Márgenes de seguridad predeterminados'+guide,encoding='utf-8')
