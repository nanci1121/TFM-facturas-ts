# Sistema de Facturas con IA Dual + RAG

Este proyecto es una plataforma integral para la gestión de facturaciones, diseñada con una arquitectura multi-tenant y un asistente de Inteligencia Artificial (IA) que combina modelos locales (Ollama) y en la nube (Gemini API) utilizando RAG (Retrieval-Augmented Generation).

## 🚀 Arquitectura

El sistema se divide en dos componentes principales:

### 1. Backend (Node.js + Express + TypeScript)
- **Persistencia**: Base de datos basada en archivos JSON (`db.json`) para simplicidad y portabilidad.
- **Autenticación**: Seguridad basada en JWT con diferentes niveles de acceso (super_admin, admin, contador, usuario).
- **IA Dual**: Lógica de conmutación automática. Si `GEMINI_API_KEY` está presente en el `.env`, utiliza los modelos de Google; de lo contrario, intenta conectar con Ollama local.
- **RAG**: Inyecta dinámicamente el estado financiero de la empresa en los prompts de la IA para evitar alucinaciones.

### 2. Frontend (React + Vite + TypeScript + Tailwind CSS)
- **Dashboard**: Vista rápida de KPIs (Total, Pendiente, Vencido).
- **Gestión**: CRUD de facturas y clientes con filtrado responsivo.
- **IA Chat**: Interfaz interactiva para consultar datos financieros en lenguaje natural.

---

## 🛠️ Instalación y Configuración

### Requisitos Previos
- Node.js (v18+)
- (Opcional) [Ollama](https://ollama.com/) para ejecución de IA local.

### Configuración del Entorno
1. Entra en la carpeta `backend/` y crea un archivo `.env` basado en `.env-ejemplo`.
2. Introduce tu `GEMINI_API_KEY` (puedes obtenerla en [Google AI Studio](https://aistudio.google.com/)).

### Pasos para Ejecutar
```bash
# Instalar dependencias globales
# (Ya deberías haberlo hecho durante la inicialización, pero por si acaso)
cd backend && npm install
cd ../frontend && npm install

# Iniciar Backend (Puerto 3001)
cd backend
npm run dev

# Iniciar Frontend (Puerto 3000)
cd ../frontend
npm run dev
```

---

## 🧪 Pruebas y Verificación

### Ejecución de Tests
- **Backend**: `cd backend && npm test`
- **Frontend**: `cd frontend && npm test`

### Verificación Manual (Credenciales por defecto)
Una vez iniciados ambos servicios, puedes registrarte como nuevo usuario o usar los datos de prueba generados.

---

## ⚙️ CI/CD (GitHub Actions)

El proyecto incluye un flujo de trabajo automatizado en `.github/workflows/ci.yml` que:
1. Instala dependencias para Frontend y Backend.
2. Ejecuta los tests unitarios y de UI.
3. Verifica que ambos proyectos compilen correctamente.

Esto asegura que cada cambio enviado al repositorio mantenga la calidad del código.

---

## 📄 Licencia
MIT
