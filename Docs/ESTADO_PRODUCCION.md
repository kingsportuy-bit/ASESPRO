# ESTADO_PRODUCCION.md

## Estado actual (2026-04-28)

ASESPRO ya tiene pipeline operativo de despliegue profesional:

- Repositorio GitHub: `git@github.com:kingsportuy-bit/ASESPRO.git`
- VPS: `root@31.97.28.4`
- Ruta en VPS: `/opt/asespro`
- Stack Swarm: `asespro`
- Servicio: `asespro-web`
- Red Traefik: `codexanet`

Dominios configurados en Traefik:

- `asespro.codexa.uy` (web publica)
- `panelasespro.codexa.uy` (entrada para panel)

---

## Situacion funcional

Hoy la app desplegada corresponde a la web en Next.js.

- Servicio en Swarm levantado (`1/1`).
- Build de produccion OK.
- TLS via Traefik + Let's Encrypt.

Pendiente funcional principal:

- Implementar panel admin real (actualmente el dominio del panel enruta al mismo servicio).

---

## Como desplegar cambios

1. Local: commit + push a `main`.
2. VPS:

```bash
cd /opt/asespro
git pull --ff-only
cd /opt/asespro/frontend
docker build -t asespro-web:latest .
cd /opt/asespro
docker stack deploy -c deploy.stack.yml asespro
```

3. Verificacion:

```bash
docker service ls
docker service ps asespro_asespro-web
docker service logs -f asespro_asespro-web
```

---

## Siguiente hito tecnico

Construir panel admin minimo productivo con:

- login
- alta/edicion de publicaciones
- carga de 1 video + multiples fotos
- operacion `alquiler/venta/ambas`
- estados `activo/desactivado/alquilado/vendido`
- conexion Supabase
