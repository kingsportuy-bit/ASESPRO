# ENCODING.md

## 🎯 Objetivo

Prevenir corrupción de texto (mojibake) en todos los archivos del proyecto.

Este problema suele manifestarse como:

* `arquitectÃ³nico` en lugar de `arquitectónico`
* `prÃ³ximo` en lugar de `próximo`

---

## ⚠️ Regla Crítica

**TODO el proyecto debe usar UTF-8 sin BOM.**

No se permite:

* Latin-1
* Windows-1252
* ANSI
* Auto-detección de encoding

---

## 🚫 Reglas Obligatorias para Agentes (Codex, etc.)

```
CRITICAL: Encoding Rules

- Always read and write files using UTF-8 (without BOM)
- Never reinterpret existing text encoding
- Never transform or normalize accented characters
- Do not modify encoding of existing files
- Preserve exact byte-level content unless explicitly editing logic
- If text appears corrupted (mojibake), STOP and do not rewrite the file
- Never rewrite full files if not strictly necessary
- Prefer minimal diffs / patches instead of full rewrites
```

---

## 🧠 Causas del Problema

### 1. Lectura incorrecta

Archivo en UTF-8 leído como Latin-1.

### 2. Doble encoding

Texto UTF-8 mal interpretado y re-guardado → corrupción acumulativa.

### 3. Reescritura completa

El agente reescribe archivos enteros cambiando encoding sin control.

---

## 🛠️ Configuración Recomendada

### VSCode

```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false
}
```

---

### Node.js

Siempre especificar encoding:

```js
fs.readFile(path, 'utf8')
fs.writeFile(path, content, 'utf8')
```

---

## 🧪 Detección de Mojibake

Patrones comunes a detectar:

* `Ã¡` → á
* `Ã©` → é
* `Ã­` → í
* `Ã³` → ó
* `Ãº` → ú
* `Ã±` → ñ

Si aparecen estos patrones:

👉 El archivo YA está corrupto o fue mal interpretado.

---

## 🧹 Estrategia de Corrección

1. NO seguir editando el archivo corrupto
2. Recuperar versión original si existe
3. Si no existe:

   * Reconvertir encoding correctamente
   * Validar manualmente caracteres

---

## 🧱 Estrategia de Trabajo Segura

* Evitar que el agente modifique archivos completos
* Trabajar con cambios mínimos (diffs)
* Revisar archivos antes de confirmar cambios
* Versionar frecuentemente (commits chicos)

---

## 🚨 Señales de Alerta

Si ves:

* Texto con `Ã`, `Â`, `�`
* Acentos rotos
* Caracteres duplicados raros

👉 DETENER el flujo inmediatamente

---

## ✅ Checklist Antes de Guardar

* [ ] El archivo está en UTF-8
* [ ] No hay caracteres corruptos
* [ ] No se reescribió el archivo completo innecesariamente
* [ ] El agente respetó las reglas de encoding

---

## 🧩 Nota Final

Este problema es silencioso y acumulativo.

Si no se controla, puede corromper completamente el repositorio.

La única defensa real es:

👉 Disciplina + reglas estrictas + validación constante
