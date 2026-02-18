---
description: Cómo iniciar el entorno de desarrollo completo (Backend y Frontend)
---

Para iniciar el proyecto completo en desarrollo, sigue estos pasos:

1. Asegúrate de que PostgreSQL esté corriendo:
```bash
docker-compose up -d postgres
```

// turbo
2. Inicia Backend y Frontend con el script de inicio rápido:
```bash
./start.sh
```

O bien, por separado en terminales distintas:

3. Inicia el Backend:
```bash
cd backend && npm run dev
```

4. Inicia el Frontend:
```bash
cd frontend && npm run dev
```

El backend estará disponible en http://localhost:3001 y el frontend en http://localhost:3000.

Para parar la aplicación: `./stop.sh`
