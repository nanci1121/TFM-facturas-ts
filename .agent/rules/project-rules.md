# Reglas del Proyecto FacturaIA

Este archivo contiene las directrices de desarrollo para mantener la consistencia del proyecto.

## 🏗 Arquitectura
- **Multi-tenant**: Todos los datos deben estar filtrados por `empresaId`. Nunca devolver datos que no pertenezcan a la empresa del usuario autenticado.
- **Backend**: Node.js con TypeScript, usando la clase `Database` para persistencia en JSON.
- **Frontend**: React con Vite y Tailwind CSS.

## 🤖 Inteligencia Artificial
- Siempre implementar un fallback de Gemini a Ollama (local).
- Los servicios de IA deben estar centralizados en `backend/src/ia/ia.service.ts`.
- La configuración de Ollama debe usar el puerto `11435` en entornos de desarrollo locales detectados.

## 🧪 Testing
- Backend: Usar Jest.
- Frontend: Usar Vitest + React Testing Library.
- Cada nueva funcionalidad crítica debe incluir al menos un test unitario.

## 📁 Ingesta de Datos
- Las facturas físicas se procesan automáticamente desde `backend/uploads/facturas`.
- Los archivos procesados deben moverse a la subcarpeta `procesadas/`.
