<![CDATA[# 🧾 FacturaIA — Sistema Inteligente de Gestión de Facturas

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.18-000000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.3-06B6D4?logo=tailwindcss" alt="Tailwind" />
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
│         Puerto 3000 (Vite Dev Server)                │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP REST (axios)
                     ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND                           │
│        Node.js + Express + TypeScript                │
│                                                      │
│  ┌──────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Auth │ │Facturas │ │Contactos │ │  IA Service  │  │
│  │ JWT  │ │  CRUD   │ │  CRUD    │ │ RAG + Multi  │  │
│  └──────┘ └─────────┘ └──────────┘ └──────┬──────┘  │
│         Puerto 3001                       │          │
└────────────────────┬──────────────────────┼──────────┘
                     │                      │
              ┌──────▼──────┐       ┌───────▼───────┐
              │   db.json   │       │  IA Providers │
              │  (JSON DB)  │       │ Gemini / Groq │
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
| **JWT** (jsonwebtoken) | Autenticación y autorización |
| **bcryptjs** | Hashing de contraseñas |
| **pdf-parse** | Extracción de texto desde PDFs |
| **axios** | Llamadas a Ollama / Groq / Minimax |
| **multer** | Upload de archivos (facturas PDF) |
| **chokidar** | Observador de archivos para procesamiento automático |
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
| **Lucide React** | Iconos SVG |
| **Vitest + Testing Library** | Testing unitario y de componentes |

---

## 🚀 Instalación rápida

### Requisitos previos
- **Node.js** v18 o superior ([descargar](https://nodejs.org/))
- **npm** (incluido con Node.js)
- (Opcional) [Ollama](https://ollama.com/) para usar IA local sin coste

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/facturas-proyecto.git
cd facturas-proyecto

# 2. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Configurar variables de entorno
cp backend/.env-ejemplo backend/.env
# Edita backend/.env con tus claves API (ver sección siguiente)

# 4. Poblar base de datos con datos de prueba
cd backend && npm run seed
cd ..

# 5. Iniciar la aplicación
./start.sh          # Linux / macOS
# o
./start.ps1         # Windows PowerShell
```

### Configuración del `.env`

```env
PORT=3001
JWT_SECRET=tu_secreto_super_seguro_aqui

# IA Configuration (elige uno o varios)
IA_DEFAULT_PROVIDER=auto

# Local IA (Ollama) — gratuito, requiere Ollama instalado
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Cloud IA (Minimax) — potente alternativa
MINIMAX_API_KEY=tu_api_key_aqui
MINIMAX_MODEL=M2-her

# Cloud IA (Groq) — alternativa rápida y gratuita
GROQ_API_KEY=tu_api_key_aqui
```

> 💡 **Tip**: Con `IA_DEFAULT_PROVIDER=auto`, el sistema intentará usar Groq primero, luego Minimax, y finalmente Ollama local.

### Iniciar manualmente (sin scripts)

```bash
# Terminal 1 — Backend (puerto 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (puerto 3000)
cd frontend && npm run dev
```

---

## 📖 Uso

### Acceso inicial

Una vez levantado, abre el navegador en **http://localhost:3000**

**Credenciales por defecto** (tras ejecutar `npm run seed`):
| Campo | Valor |
|-------|-------|
| Email | `admin@sistema.com` |
| Contraseña | `admin123` |

### Flujo típico

1. **Inicia sesión** con las credenciales de prueba.
2. **Dashboard**: Revisa los KPIs y gráficos de tu empresa.
3. **Facturas → Subir Gasto**: Arrastra un PDF de una factura recibida. La IA extraerá automáticamente emisor, importe, fecha y categoría.
4. **Facturas → Nueva Factura**: Crea una factura de ingreso manualmente.
5. **Contactos**: Gestiona tus clientes y proveedores.
6. **IA Assistant**: Pregunta cualquier cosa sobre tus finanzas en lenguaje natural.
7. **Reportes**: Consulta análisis detallados de ingresos y gastos.

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
| `security.test.ts` | `backend/src/tests/` | Autenticación JWT, protección de rutas |
| `ai-extraction.test.ts` | `backend/src/tests/` | Extracción de datos de facturas con IA |
| `ia-rag-deep-dive.test.ts` | `backend/src/tests/` | Contexto RAG y respuestas de la IA |
| `Sidebar.test.tsx` | `frontend/src/components/` | Renderizado correcto de la navegación |

---

## ⚙️ CI/CD

El proyecto incluye un pipeline de **GitHub Actions** (`.github/workflows/ci.yml`) que se ejecuta en cada push o PR a `main`:

1. **Backend CI**: Instala dependencias → Ejecuta tests → Compila TypeScript.
2. **Frontend CI**: Instala dependencias → Ejecuta tests → Build de producción.

Esto garantiza que cada cambio en el repositorio mantenga la calidad del código.

---

## 📁 Estructura del proyecto

```
facturas-proyecto/
├── README.md                    # ← Este archivo
├── start.sh / start.ps1        # Scripts de inicio rápido
├── stop.sh / stop.ps1          # Scripts para detener servicios
├── .github/workflows/ci.yml    # Pipeline CI/CD
│
├── backend/                    # API REST + IA
│   ├── README.md               # Documentación del backend
│   ├── .env-ejemplo            # Variables de entorno de ejemplo
│   ├── db.json                 # Base de datos JSON
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts              # Configuración Express
│       ├── index.ts            # Punto de entrada
│       ├── auth/               # Autenticación (login, registro, JWT)
│       ├── empresas/           # Gestión de empresas
│       ├── clientes/           # Gestión de contactos (clientes/proveedores)
│       ├── facturas/           # CRUD de facturas
│       ├── ia/                 # Servicios de IA (extracción, chat, RAG)
│       ├── reportes/           # Generación de reportes
│       ├── database/           # Capa de persistencia (JSON)
│       ├── middleware/         # Middleware de autenticación
│       ├── types/              # Interfaces TypeScript
│       ├── scripts/            # Seed y utilidades
│       └── tests/              # Tests unitarios e integración
│
└── frontend/                   # Interfaz web
    ├── README.md               # Documentación del frontend
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx             # Rutas y componente raíz
        ├── main.tsx            # Punto de entrada React
        ├── index.css           # Estilos globales Tailwind
        ├── pages/              # Páginas (Dashboard, Facturas, Contactos...)
        ├── components/         # Componentes reutilizables
        ├── services/           # Cliente HTTP (axios)
        ├── store/              # Estado global (Zustand)
        └── test/               # Tests de componentes
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
]]>
