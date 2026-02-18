# Reglas del Proyecto FacturaIA

Este archivo contiene las directrices de desarrollo para mantener la consistencia del proyecto.

## 🏗 Arquitectura
- **Multi-tenant**: Todos los datos deben estar filtrados por `empresaId`. Nunca devolver datos que no pertenezcan a la empresa del usuario autenticado.
- **Backend**: Node.js con TypeScript, usando **Prisma ORM** para persistencia en **PostgreSQL**.
- **Frontend**: React con Vite y Tailwind CSS.
- **Contenedores**: Docker y Docker Compose para desarrollo y producción.

## 🗄️ Base de Datos
- La base de datos es **PostgreSQL 15**, gestionada mediante **Prisma ORM**.
- El cliente Prisma se importa siempre desde `backend/src/database/db.ts`.
- Cualquier cambio en el esquema debe hacerse en `prisma/schema.prisma` y generar una migración con `npx prisma migrate dev`.
- **Nunca** modificar directamente la base de datos sin pasar por Prisma.

## 🤖 Inteligencia Artificial
- El sistema de IA implementa un **fallback en cascada**: Groq → Minimax → OpenRouter → Ollama.
- Los servicios de IA deben estar centralizados en `backend/src/ia/`.
- La configuración de Ollama usa el puerto `11434` por defecto.

## 🧪 Testing
- Backend: Usar **Jest** con Supertest para tests de integración.
- Frontend: Usar **Vitest** + React Testing Library.
- Cada nueva funcionalidad crítica debe incluir al menos un test unitario.
- Los tests de integración deben usar una base de datos PostgreSQL real (no mocks de DB).

## 📁 Ingesta de Datos
- Las facturas físicas se procesan automáticamente desde `backend/uploads/facturas`.
- Los archivos procesados deben moverse a la subcarpeta `procesadas/`.
- El directorio `uploads/` debe persistirse como volumen Docker en producción.

## 🐳 Docker
- El `docker-compose.yml` en la raíz gestiona toda la infraestructura.
- Perfil `production`: levanta backend + frontend + postgres + pgadmin.
- Sin perfil (por defecto): solo levanta postgres + pgadmin + ollama (para desarrollo local).
