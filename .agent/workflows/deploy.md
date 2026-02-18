---
description: Cómo desplegar la aplicación completa en un servidor Debian con Docker
---

Este workflow despliega FacturaIA en producción junto al portafolio existente, usando
subdominios de `moralesluna.com` con Nginx como proxy inverso y Cloudflare para SSL.

## Arquitectura en el servidor

```
Internet (Cloudflare)
    │
    ├── portafolio.moralesluna.com  → Nginx → Next.js (existente)
    ├── facturas.moralesluna.com    → Nginx → Docker:3000 (frontend React)
    └── api-facturas.moralesluna.com → Nginx → Docker:3001 (backend API)
```

---

## PASO 1 — En Cloudflare: Crear registros DNS

En el panel de Cloudflare para `moralesluna.com`, añadir:

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| A | `facturas` | `IP_DEL_SERVIDOR` | ✅ Activado |
| A | `api-facturas` | `IP_DEL_SERVIDOR` | ✅ Activado |

---

## PASO 2 — En el servidor Debian: Clonar y configurar

1. Conectarse al servidor por SSH:
```bash
ssh usuario@IP_DEL_SERVIDOR
```

2. Clonar el repositorio:
```bash
git clone https://github.com/nanci1121/TFM-facturas-ts.git
cd TFM-facturas-ts
```

3. Crear el archivo de variables de entorno:
```bash
cp backend/.env-ejemplo backend/.env
nano backend/.env
```
Editar con valores seguros: `JWT_SECRET`, claves API de IA, etc.

4. Crear un `.env` en la raíz del proyecto (opcional, para personalizar):
```bash
# .env en la raíz — personalizar si es necesario
DB_USER=admin
DB_PASSWORD=mi_password_seguro
DB_NAME=facturas_db
JWT_SECRET=mi_jwt_secret_muy_largo_y_seguro
VITE_API_URL=https://api-facturas.moralesluna.com
```

---

## PASO 3 — Levantar los contenedores Docker

// turbo
5. Construir e iniciar todos los servicios:
```bash
docker compose --profile production up -d --build
```

6. Ejecutar migraciones y seed (solo la primera vez):
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

7. Verificar que todos los contenedores están corriendo:
```bash
docker compose --profile production ps
```

---

## PASO 4 — Configurar Nginx en el servidor

8. Copiar la configuración de Nginx al servidor:
```bash
sudo cp nginx-server.conf /etc/nginx/sites-available/facturas
sudo ln -s /etc/nginx/sites-available/facturas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

9. Obtener certificados SSL con Certbot:
```bash
sudo certbot --nginx -d facturas.moralesluna.com -d api-facturas.moralesluna.com
```

---

## Actualizar la aplicación

Cuando haya cambios en el repositorio:
```bash
git pull
docker compose --profile production up -d --build
```

## Ver logs

```bash
docker compose logs -f backend    # Logs del backend
docker compose logs -f frontend   # Logs del frontend (Nginx)
docker compose logs -f postgres   # Logs de la base de datos
```

## Acceso a los servicios

- **App**: https://facturas.moralesluna.com
- **API**: https://api-facturas.moralesluna.com
- **pgAdmin**: http://IP_DEL_SERVIDOR:5050 (solo acceso interno)
