---
description: Cómo poblar la base de datos con datos de prueba iniciales
---

Este workflow ejecuta el script de seed de Prisma que crea empresas, usuarios y facturas de ejemplo en PostgreSQL.

**Requisito previo**: La base de datos debe estar corriendo (`docker-compose up -d postgres`).

// turbo
1. Ejecutar el script de seed:
```bash
cd backend && npm run seed
```

Las credenciales generadas serán:
- **Email**: admin@sistema.com
- **Password**: admin123
