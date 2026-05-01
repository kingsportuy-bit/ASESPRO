# GUIA_ACTUALIZAR_VPS.md

## Objetivo

Esta guia describe el flujo correcto y seguro para actualizar cualquier proyecto desplegado en el VPS.

Flujo estandar:

1. Cambios en local.
2. Push a GitHub.
3. Pull + build + deploy en VPS.
4. Validacion final.

---

## 1) Checklist previo

Antes de actualizar, confirmar:

- El proyecto compila localmente (`npm run build` o equivalente).
- No hay secretos en Git.
- El `.env` real ya existe en VPS (`/opt/NOMBRE_PROYECTO/.env`).
- El `deploy.stack.yml` apunta al servicio y dominio correctos.

---

## 2) Actualizacion desde local

### Metodo estandar ASESPRO

Para ASESPRO, usar el script versionado:

```powershell
cd C:\Users\Fito\Documents\CODEX\ASESPRO
.\scripts\deploy-asespro.ps1 -CommitMessage "mensaje claro del cambio"
```

El script ejecuta el flujo completo:

1. Verifica que la rama local sea `main`.
2. Ejecuta `git diff --check`.
3. Compila el frontend localmente con `npm run build`.
4. Agrega cambios, crea commit y hace `git push`.
5. En VPS ejecuta `git pull --ff-only`.
6. Construye la imagen Docker `asespro-web:latest`.
7. Ejecuta `docker stack deploy`.
8. Fuerza refresh de `asespro_asespro-web`.
9. Valida web y panel por HTTPS.

Variantes utiles:

```powershell
.\scripts\deploy-asespro.ps1 -NoCommit
.\scripts\deploy-asespro.ps1 -SkipLocalBuild
.\scripts\deploy-asespro.ps1 -TailLogs
```

Usar comandos manuales solo si el script falla o si se necesita diagnostico puntual.

---

## 2.b) Actualizacion manual desde local

En la maquina local:

```bash
cd RUTA_DEL_PROYECTO
git status
git add .
git commit -m "mensaje claro del cambio"
git push
```

Recomendacion:

- Commits chicos y descriptivos.
- Evitar mezclar cambios no relacionados en el mismo commit.

---

## 3) Actualizacion en VPS

Conectarse al servidor:

```bash
ssh root@31.97.28.4
```

Ir al proyecto y traer cambios:

```bash
cd /opt/NOMBRE_PROYECTO
git pull --ff-only
```

Build de imagen (ajustar carpeta segun proyecto):

```bash
cd /opt/NOMBRE_PROYECTO/frontend
docker build -t nombre-app:latest .
```

Deploy del stack:

```bash
cd /opt/NOMBRE_PROYECTO
docker stack deploy -c deploy.stack.yml nombre_stack
```

Forzar refresh del servicio (recomendado cuando se usa misma tag `latest`):

```bash
docker service update --force nombre_stack_nombre-servicio
```

---

## 4) Validacion post-deploy

Ver estado general:

```bash
docker service ls
docker service ps nombre_stack_nombre-servicio
```

Ver logs:

```bash
docker service logs -f nombre_stack_nombre-servicio
```

Resultado esperado:

- Servicio en `1/1` (o la cantidad de replicas definida).
- Sin reinicios en bucle.
- App accesible por dominio HTTPS.

---

## 5) Si algo falla

1. Revisar logs del servicio.
2. Confirmar que `git pull` trajo el commit esperado.
3. Repetir build + deploy + `service update --force`.
4. Verificar variables en `.env` del VPS.

Comandos utiles:

```bash
git log --oneline -n 5
docker images | head
docker service logs --tail 100 nombre_stack_nombre-servicio
```

---

## 6) Buenas practicas recomendadas

- Usar siempre `git pull --ff-only`.
- Mantener `deploy.stack.yml` versionado en Git.
- No editar codigo directo en VPS.
- No subir `.env` real a GitHub.
- Si se usa `latest`, forzar update del servicio.

---

## Plantilla rapida (copiar y pegar)

```bash
# LOCAL
cd RUTA_DEL_PROYECTO
git add .
git commit -m "update"
git push

# VPS
ssh root@31.97.28.4
cd /opt/NOMBRE_PROYECTO
git pull --ff-only
cd /opt/NOMBRE_PROYECTO/frontend
docker build -t nombre-app:latest .
cd /opt/NOMBRE_PROYECTO
docker stack deploy -c deploy.stack.yml nombre_stack
docker service update --force nombre_stack_nombre-servicio
docker service ps nombre_stack_nombre-servicio
```
