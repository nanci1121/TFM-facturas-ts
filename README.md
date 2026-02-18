# 🧾 FacturaIA — Sistema Inteligente de Gestión de Facturas

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.18-000000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.3-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/License-AGPL%20v3-blue" alt="AGPL v3 License" />
</p>

**FacturaIA** es una plataforma web de gestión de facturas con Inteligencia Artificial integrada. Permite a autónomos, pymes y equipos de contabilidad gestionar sus ingresos y gastos, automatizar la extracción de datos desde PDFs y consultar su información financiera en lenguaje natural a través de un asistente de IA.

---

## 📋 Tabla de Contenidos

- [¿Qué es FacturaIA?](#-qué-es-facturaia)
- [¿Para quién es?](#-para-quién-es)
- [Funcionalidades principales](#-funcionalidades-principales)
- [Arquitectura del proyecto](#-arquitectura-del-proyecto)
- [Stack tecnológico](#-stack-tecnológico)
- [Instalación rápida](#-instalación-rápida)
- [Despliegue con Docker (Producción)](#-despliegue-con-docker-producción)
- [Uso](#-uso)
- [Testing](#-testing)
- [CI/CD](#-cicd)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 ¿Qué es FacturaIA?

FacturaIA nace como un **Trabajo Final de Máster (TFM)** con el objetivo de demostrar cómo la IA puede transformar la gestión contable. No es solo un CRUD de facturas: integra un sistema inteligente capaz de:

- **Extraer datos automáticamente desde PDFs** de facturas mediante IA (Groq, Minimax u Ollama local).
- **Clasificar automáticamente** gastos e ingresos por categoría.
- **Responder preguntas en lenguaje natural** sobre tu estado financiero gracias a RAG (Retrieval-Augmented Generation).
- **Gestionar contactos** (clientes y proveedores) de forma unificada.

---

## 👥 ¿Para quién es?

| Perfil | Uso |
|--------|-----|
| **Autónomos / Freelancers** | Control de ingresos y gastos con mínimo esfuerzo: sube el PDF y la IA hace el resto. |
| **Pymes** | Gestión multi-usuario con roles (admin, contador, usuario). |
| **Equipos de contabilidad** | Dashboard con KPIs, reportes y filtrado avanzado. |
| **Estudiantes / Desarrolladores** | Base de código moderna con TypeScript, tests y CI/CD para aprender o extender. |

---

## ✨ Funcionalidades principales

### 📊 Dashboard
- KPIs de resumen: Total facturado, pendiente, vencido, balance neto.
- Gráficos de evolución mensual (ingresos vs gastos).
- Top categorías de gasto y distribución por tipo.

### 🧾 Gestión de Facturas
- Flujo dual: **Gastos** (facturas que recibes) e **Ingresos** (facturas que emites).
- Subida de PDFs con **extracción automática por IA** (emisor, importe, fecha, categoría).
- Creación manual de facturas con validación de datos.
- Filtrado por tipo, estado, categoría y búsqueda libre.

### 🤖 Asistente de IA (Chat)
- Consulta tus finanzas en lenguaje natural: *"¿Cuánto gasté en telecomunicaciones?"*
- Implementación RAG: la IA recibe el contexto real de tu empresa antes de responder.
- Soporte multi-proveedor: **Groq**, **Minimax** u **Ollama** (local, sin coste).

### 📇 Contactos (Clientes & Proveedores)
- Gestión unificada con filtrado por tipo.
- KPIs: total de contactos, clientes, proveedores, facturado.
- CRUD completo con eliminación lógica (soft delete).

### 📈 Reportes
- Informe de resultados con métricas clave.
- Análisis por categorías y evolución temporal.

### ⚙️ Configuración
- Configuración de proveedor de IA por empresa.
- Gestión de claves API.
- Preferencias de moneda e impuestos.

### 🌙 Modo Oscuro
- Toggle de tema claro/oscuro persistente.

---

## 🏗️ Arquitectura del proyecto

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│         React + Vite + TypeScript + Tailwind         │
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐ │
│  │Dashboard│  │ Facturas │  │Contactos│  │IA Chat │ │
│  └─────────┘  └──────────┘  └─────────┘  └────────┘ │
│         Puerto 3000 (Nginx en producción)            │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP REST (axios)
                     ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND                           │
│        Node.js + Express + TypeScript                │
│                                                      │
│  ┌──────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Auth │ │Facturas │ │Contactos │ │  IA Service  │  │
│  │ JWT  │ │ PRISMA  │ │ PRISMA   │ │ RAG + Multi  │  │
│  └──────┘ └─────────┘ └──────────┘ └──────┬──────┘  │
│         Puerto 3001                       │          │
└────────────────────┬──────────────────────┼──────────┘
                     │                      │
              ┌──────▼──────┐       ┌───────▼───────┐
              │ PostgreSQL  │       │  IA Providers │
              │ (Prisma ORM)│       │ Groq / Minimax│
              └─────────────┘       │   / Ollama    │
                                    └───────────────┘
```

---

## 🛠️ Stack tecnológico

### Backend
| Tecnología | Propósito |
|:-----------|:----------|
| **Node.js 20+** | Runtime de servidor |
| **Express 4.18** | Framework HTTP / API REST |
| **TypeScript 5** | Tipado estático |
| **Prisma ORM 5.22** | Capa de datos y modelado DB |
| **PostgreSQL 15** | Base de datos relacional robusta |
| **JWT** (jsonwebtoken) | Autenticación y autorización |
| **bcryptjs** | Hashing de contraseñas |
| **pdf-parse** | Extracción de texto desde PDFs |
| **axios** | Llamadas a Ollama / Groq / Minimax |
| **multer** | Upload de archivos (facturas PDF) |
| **Jest + Supertest** | Testing unitario e integración |

### Frontend
| Tecnología | Propósito |
|:-----------|:----------|
| **React 18** | UI con componentes funcionales + hooks |
| **Vite 5** | Build tool ultrarrápido con HMR |
| **TypeScript 5** | Tipado estático |
| **Tailwind CSS 3** | Estilado utility-first con dark mode |
| **Zustand** | Gestión de estado global (auth, theme) |
| **React Router 6** | Navegación SPA |
| **Recharts** | Gráficos y visualizaciones |
| **Vitest + Testing Library** | Testing unitario y de componentes |

### Infraestructura
| Tecnología | Propósito |
|:-----------|:----------|
| **Docker + Docker Compose** | Contenedores para despliegue reproducible |
| **Nginx** | Servidor web para el frontend en producción |
| **GitHub Actions** | Pipeline CI/CD automatizado |

---

## 🚀 Instalación rápida (Desarrollo local)

### Requisitos previos
- **Node.js** v18 o superior ([descargar](https://nodejs.org/))
- **npm** (incluido con Node.js)
- **Docker & Docker Compose** (para PostgreSQL y Ollama)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/nanci1121/TFM-facturas-ts.git
cd TFM-facturas-ts

# 2. Levantar la base de datos y servicios de infraestructura
docker-compose up -d postgres

# 3. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
cd ..

# 4. Configurar variables de entorno
cp backend/.env-ejemplo backend/.env
# Edita backend/.env con DATABASE_URL y tus claves API

# 5. Ejecutar migraciones y poblar base de datos
cd backend
npx prisma migrate dev --name init
npm run seed
cd ..

# 6. Iniciar la aplicación
./start.sh          # Linux / macOS
```

### Configuración del `.env`

```env
PORT=3001
JWT_SECRET=tu_secreto_super_seguro_aqui
DATABASE_URL="postgresql://admin:admin123@localhost:5433/facturas_db?schema=public"

# IA Configuration
IA_DEFAULT_PROVIDER=auto

# Local IA (Ollama)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Cloud IA (opcional)
GROQ_API_KEY=tu_api_key_de_groq
MINIMAX_API_KEY=tu_api_key_de_minimax
```

---

## 🐳 Despliegue con Docker (Producción)

Para desplegar la aplicación completa en un servidor (ej. Debian), usa el perfil de producción:

```bash
# 1. Clonar el repositorio en el servidor
git clone https://github.com/nanci1121/TFM-facturas-ts.git
cd TFM-facturas-ts

# 2. Crear el archivo de variables de entorno de producción
cp backend/.env-ejemplo backend/.env
# Edita backend/.env con valores seguros para producción

# 3. Levantar todos los servicios (BD + Backend + Frontend)
docker-compose --profile production up -d --build

# 4. Ejecutar migraciones y seed (solo la primera vez)
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

Los servicios estarán disponibles en:
- **Frontend**: `http://tu-servidor:4000` (o `http://localhost:4000` en local)
- **Backend API**: `http://tu-servidor:4001`
- **pgAdmin**: `http://tu-servidor:5050`

Consulta la [guía de despliegue completa](backend/README.md#despliegue-en-producción) para más detalles.

---

## 📖 Uso

### Acceso y Credenciales

Una vez desplegada la aplicación, puedes acceder a ella a través de las siguientes URLs:

| Servicio | URL Local (Dev) | URL Servidor (Prod) | Descripción |
|---|---|---|---|
| **Frontend (App)** | `http://localhost:3000` | `http://tu-servidor:4000` | Interfaz de usuario principal |
| **Backend (API)** | `http://localhost:3001` | `http://tu-servidor:4001` | API REST y documentación |
| **pgAdmin (DB)** | `http://localhost:5050` | `http://tu-servidor:5050` | Gestión visual de la base de datos |

#### 🔑 Usuario Administrador por Defecto

El sistema se inicializa con un usuario administrador preconfigurado para pruebas:

- **Email:** `admin@sistema.com`
- **Contraseña:** `admin123`

> **Nota:** Este usuario tiene permisos completos sobre todas las empresas y configuraciones.

#### 👤 Crear Nuevos Usuarios

Actualmente el registro público está deshabilitado por seguridad en el frontend. Para crear nuevos usuarios, tienes dos opciones:

1. **Usando la API (Postman / Curl):**
   ```bash
   curl -X POST http://tu-servidor:4001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "nuevo@usuario.com",
       "password": "password123",
       "nombre": "Profesor Evaluador"
     }'
   ```

2. **Accediendo a la base de datos:**
   Opcionalmente puedes insertar usuarios directamente usando **pgAdmin** en el puerto 5050 (Credentials: `admin@admin.com` / `admin123`).

---

## 🧪 Testing

```bash
# Tests del Backend (Jest)
cd backend && npm test

# Tests del Frontend (Vitest)
cd frontend && npm test

# Frontend con interfaz visual
cd frontend && npx vitest --ui
```

### Tests incluidos

| Test | Ubicación | Descripción |
|------|-----------|-------------|
| `security.test.ts` | `backend/src/tests/` | Autenticación JWT, protección de rutas y multi-tenencia |
| `ai-extraction.test.ts` | `backend/src/tests/` | Extracción de datos de facturas con IA (Prisma mocks) |
| `facturas.integration.test.ts` | `backend/src/tests/` | Integración real Facturas <-> PostgreSQL |

---

## ⚙️ CI/CD

El proyecto incluye un pipeline de **GitHub Actions** (`.github/workflows/ci.yml`) que se ejecuta en cada push o PR a `main`:

1. **Backend CI**: Instala dependencias → Genera Prisma Client → Sincroniza esquema DB → Ejecuta tests → Compila TypeScript.
2. **Frontend CI**: Instala dependencias → Ejecuta tests → Build de producción.

Para configurar los secretos necesarios en GitHub, consulta el workflow `/setup-cicd`.

---

## 📁 Estructura del proyecto

```
facturas-proyecto/
├── README.md                    # ← Este archivo
├── start.sh / start.ps1        # Scripts de inicio rápido (desarrollo)
├── stop.sh / stop.ps1          # Scripts de parada
├── docker-compose.yml          # Infraestructura completa (dev + producción)
├── .github/workflows/ci.yml    # Pipeline CI/CD
│
├── backend/                    # API REST + IA
│   ├── README.md               # Documentación del backend
│   ├── Dockerfile              # Imagen Docker del backend
│   ├── prisma/                 # Esquema (schema.prisma) y migraciones
│   └── src/
│       ├── auth/               # Autenticación y JWT
│       ├── clientes/           # Gestión de contactos (Prisma)
│       ├── facturas/           # Gestión de facturas (Prisma)
│       ├── ia/                 # IA (extracción, chat, RAG)
│       ├── reportes/           # KPIs y estadísticas financieras
│       ├── database/           # Cliente Prisma unificado (db.ts)
│       └── tests/              # Tests unitarios e integración
│
└── frontend/                   # Interfaz web (React)
    ├── Dockerfile              # Imagen Docker del frontend (Nginx)
    └── src/
        ├── pages/              # Dashboard, Facturas, Clientes, Chat...
        ├── components/         # Componentes UI reutilizables
        ├── services/           # Cliente API (axios)
        └── store/              # Estado global (Zustand)
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para contribuir:

1. Haz un **fork** del repositorio.
2. Crea una rama para tu feature: `git checkout -b feature/mi-mejora`
3. Haz commit de tus cambios: `git commit -m "feat: mi mejora"`
4. Haz push a tu rama: `git push origin feature/mi-mejora`
5. Abre un **Pull Request** hacia `main`.

### Convenciones

- Commits: Usa [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)
- Código: TypeScript estricto, sin `any` innecesarios
- Tests: Añade tests para cada nueva funcionalidad

---

## 📄 Licencia

Este proyecto está bajo la licencia **AGPL-3.0**. Consulta el archivo [LICENSE](LICENSE) para más detalles. Esto garantiza que cualquier modificación o uso derivado del código debe permanecer libre y abierto.

---

<p align="center">
  Hecho con ❤️ como Trabajo Final de Máster<br/>
  <strong>FacturaIA</strong> — Gestión inteligente de facturas
</p>
