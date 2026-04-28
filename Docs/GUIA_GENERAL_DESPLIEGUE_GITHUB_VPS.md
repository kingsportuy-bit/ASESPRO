# GUIA_GENERAL_DESPLIEGUE_GITHUB_VPS.md

## Objetivo

Guia base para iniciar y desplegar cualquier proyecto en nuestra infraestructura:

- GitHub: `github.com/kingsportuy-bit`
- VPS: `root@31.97.28.4`
- Orquestacion: Docker Swarm
- Proxy/SSL: Traefik
- Red compartida: `codexanet`

Esta guia sirve para web apps, paneles internos o APIs containerizadas.

---

## 1) Crear un proyecto nuevo (local)

1. Crear carpeta del proyecto.
2. Agregar codigo base.
3. Definir estructura minima:

```text
/proyecto
  /app o /src
  Dockerfile
  .gitignore
  .env.example
  deploy.stack.yml
  README.md
```

4. Crear `.env.example` sin secretos (solo nombres de variables).

Ejemplo:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_WHATSAPP_PHONE=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 2) Crear el repo en GitHub

1. Ir a [GitHub](https://github.com) con cuenta `kingsportuy-bit`.
2. Crear repo nuevo (ejemplo: `NOMBRE-PROYECTO`).
3. Dejarlo vacio (sin README inicial) si ya hay codigo local.

---

## 3) Conectar proyecto local con GitHub

En la carpeta raiz del proyecto:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initial project setup"
git remote add origin git@github.com:kingsportuy-bit/NOMBRE-PROYECTO.git
git push -u origin main
```

Si falla por SSH:

1. Generar clave local.
2. Agregar clave publica a GitHub (`Settings > SSH and GPG keys`).
3. Reintentar push.

---

## 4) Preparar Dockerfile de produccion

Requisitos:

- Imagen base estable (ej: `node:20-alpine`).
- Build de produccion.
- Exponer puerto interno de app (ej: `3000`).
- Comando de arranque productivo.

Validar local:

```bash
docker build -t nombre-app:latest .
docker run --rm -p 3000:3000 nombre-app:latest
```

---

## 5) Crear `deploy.stack.yml` (Swarm + Traefik)

Plantilla base:

```yaml
version: "3.9"

services:
  nombre-app:
    image: nombre-app:latest
    env_file:
      - /opt/NOMBRE_PROYECTO/.env
    networks:
      - codexanet
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
      labels:
        - traefik.enable=true
        - traefik.docker.network=codexanet
        - traefik.http.routers.nombre-app.rule=Host(`dominio.codexa.uy`) || Host(`paneldominio.codexa.uy`)
        - traefik.http.routers.nombre-app.entrypoints=websecure
        - traefik.http.routers.nombre-app.tls=true
        - traefik.http.routers.nombre-app.tls.certresolver=letsencryptresolver
        - traefik.http.services.nombre-app.loadbalancer.server.port=3000

networks:
  codexanet:
    external: true
```

---

## 6) Preparar VPS (una vez por proyecto)

Conectarse:

```bash
ssh root@31.97.28.4
```

Crear carpeta del proyecto:

```bash
mkdir -p /opt/NOMBRE_PROYECTO
```

Si el VPS no tiene acceso al repo por SSH:

1. Generar clave en VPS:
```bash
ssh-keygen -t ed25519 -C "root-vps-NOMBRE_PROYECTO" -f /root/.ssh/id_ed25519 -N ""
cat /root/.ssh/id_ed25519.pub
```
2. Agregar esa clave en GitHub del repo:
- `Repo > Settings > Deploy keys > Add deploy key`

---

## 7) Clonar repo en VPS

```bash
cd /opt/NOMBRE_PROYECTO
git clone git@github.com:kingsportuy-bit/NOMBRE-PROYECTO.git .
```

---

## 8) Crear `.env` real en VPS

Archivo obligatorio para runtime:

```bash
cat > /opt/NOMBRE_PROYECTO/.env << 'EOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SITE_URL=https://dominio.codexa.uy
# resto de variables reales
EOF
```

Nunca subir este `.env` a GitHub.

---

## 9) Build y deploy en VPS

Si Dockerfile esta en raiz:

```bash
cd /opt/NOMBRE_PROYECTO
docker build -t nombre-app:latest .
docker stack deploy -c deploy.stack.yml nombre_stack
```

Si Dockerfile esta en subcarpeta (ej: `frontend`):

```bash
cd /opt/NOMBRE_PROYECTO/frontend
docker build -t nombre-app:latest .
cd /opt/NOMBRE_PROYECTO
docker stack deploy -c deploy.stack.yml nombre_stack
```

---

## 10) DNS y dominio

Antes de validar HTTPS:

1. Crear subdominio en DNS (ej: `app.codexa.uy`).
2. Apuntarlo a `31.97.28.4`.
3. Esperar propagacion.

Traefik emitira TLS con `letsencryptresolver` cuando el dominio resuelva bien.

---

## 11) Validacion post-deploy

Comandos clave:

```bash
docker service ls
docker service ps nombre_stack_nombre-app
docker service logs -f nombre_stack_nombre-app
```

Checklist:

- Servicio en `1/1` o mas replicas segun configuracion.
- Sin reinicios en bucle.
- Sitio accesible por HTTPS.
- Healthcheck OK.
- Variables cargadas correctamente.

---

## 12) Flujo de actualizacion (dia a dia)

1. Cambios locales.
2. Commit y push a `main`.
3. En VPS:

```bash
cd /opt/NOMBRE_PROYECTO
git pull --ff-only
cd RUTA_BUILD
docker build -t nombre-app:latest .
cd /opt/NOMBRE_PROYECTO
docker stack deploy -c deploy.stack.yml nombre_stack
```

4. Verificar logs y estado.

---

## 13) Convenciones recomendadas

- Carpeta VPS por proyecto: `/opt/NOMBRE_PROYECTO`
- Archivo env por proyecto: `/opt/NOMBRE_PROYECTO/.env`
- Stack name corto: `asespro`, `crm`, `landing1`, etc.
- Imagen local: `nombre-app:latest`
- Dominio publico: `proyecto.codexa.uy`
- Dominio panel: `panelproyecto.codexa.uy`

---

## 14) Errores comunes y solucion rapida

1. `Permission denied (publickey)` al clonar:
- Falta deploy key del VPS en GitHub.

2. `open /opt/.../.env: no such file or directory`:
- Falta crear `.env` en VPS.

3. Traefik no enruta:
- Revisar `Host(...)` en labels.
- Revisar red `codexanet`.
- Verificar DNS apuntando a `31.97.28.4`.

4. HTTPS no levanta:
- DNS aun no propagado.
- Error en `certresolver` o labels.

5. Servicio no arranca:
- Revisar logs del servicio.
- Revisar comando de start y puerto interno.

---

## 15) Plantilla rapida de comandos (copiar y pegar)

Local:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initial setup"
git remote add origin git@github.com:kingsportuy-bit/NOMBRE-PROYECTO.git
git push -u origin main
```

VPS:

```bash
ssh root@31.97.28.4
mkdir -p /opt/NOMBRE_PROYECTO
cd /opt/NOMBRE_PROYECTO
git clone git@github.com:kingsportuy-bit/NOMBRE-PROYECTO.git .
# crear .env
cd RUTA_BUILD
docker build -t nombre-app:latest .
cd /opt/NOMBRE_PROYECTO
docker stack deploy -c deploy.stack.yml nombre_stack
```

---

## Nota para ASESPRO

En ASESPRO actual:

- Repo: `git@github.com:kingsportuy-bit/ASESPRO.git`
- VPS path: `/opt/asespro`
- Stack: `asespro`
- Servicio: `asespro-web`
- Dominios:
  - `asespro.codexa.uy`
  - `panelasespro.codexa.uy`
