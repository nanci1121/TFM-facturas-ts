<![CDATA[# 🔧 FacturaIA — Backend

API REST construida con **Node.js + Express + TypeScript** que gestiona facturas, contactos, empresas y autenticación, con un sistema de IA dual integrado para la extracción automática de datos y un asistente conversacional con RAG.

---

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Sistema de IA](#-sistema-de-ia)
- [Base de datos](#-base-de-datos)
- [Autenticación y roles](#-autenticación-y-roles)
- [Testing](#-testing)
- [Scripts disponibles](#-scripts-disponibles)
- [Estructura de archivos](#-estructura-de-archivos)

---

## 🏗️ Arquitectura

El backend sigue una arquitectura modular por dominio. Cada módulo tiene su propio controlador y rutas:

```
Petición HTTP
     │
     ▼
  app.ts (Express)
     │
     ├─ /api/v1/auth        → auth.controller.ts        (Login, Registro)
     ├─ /api/v1/empresas     → empresas.controller.ts    (Config empresa)
     ├─ /api/v1/contactos    → clientes.controller.ts    (Clientes/Proveedores)
     ├─ /api/v1/facturas     → facturas.controller.ts    (CRUD facturas)
     ├─ /api/v1/ia           → ia.controller.ts          (Chat IA + RAG)
     └─ /api/v1/reportes     → reportes.controller.ts    (Informes)
           │
           ▼
     middleware/auth.middleware.ts (verificación JWT)
           │
           ▼
     database/db.ts (Prisma Client)
           │
           ▼
     PostgreSQL (Base de datos relacional)
```

---

## 🛠️ Stack tecnológico

| Paquete | Versión | Propósito |
|:--------|:--------|:----------|
| `express` | 4.18 | Framework HTTP |
| `prisma` | 5.22 | ORM (Type-safe query builder) |
| `@prisma/client` | 5.22 | Cliente de base de datos generado |
| `typescript` | 5.x | Tipado estático |
| `ts-node-dev` | 2.0 | Hot-reload en desarrollo |
| `jsonwebtoken` | 9.0 | Generación y verificación de tokens JWT |
| `bcryptjs` | 2.4 | Hash seguro de contraseñas |
| `multer` | 2.0 | Upload de archivos PDF |
| `pdf-parse` | 2.4 | Extracción de texto desde PDFs |
| `axios` | 1.6 | Cliente HTTP (para Ollama, Groq y Minimax) |
| `uuid` | 9.0 | Generación de IDs únicos |
| `dotenv` | 16.3 | Variables de entorno |
| `date-fns` | 2.30 | Utilidades de fechas |
| `jest` | 30.x | Framework de testing |
| `supertest` | 7.x | Testing de endpoints HTTP |

---

## 🚀 Instalación

```bash
# Desde la raíz del proyecto
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env-ejemplo .env
# Edita .env con tus valores (ver sección siguiente)

# Poblar la base de datos con datos de prueba
npm run seed

# Iniciar en modo desarrollo (hot-reload)
npm run dev
```

El servidor estará disponible en **http://localhost:3001**

---

## 🔐 Variables de entorno

Crea un archivo `.env` basándote en `.env-ejemplo`:

```env
# Servidor
PORT=3001
JWT_SECRET=tu_secreto_super_seguro_aqui

# Configuración IA
IA_DEFAULT_PROVIDER=auto    # auto | groq | minimax | ollama

# Ollama (IA local, gratuito)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Minimax (Cloud)
MINIMAX_API_KEY=tu_api_key_de_minimax
MINIMAX_MODEL=M2-her

# Groq (Cloud, gratuito con límites)
GROQ_API_KEY=tu_api_key_de_groq
```

### Obtener claves API gratuitas

| Proveedor | URL | Notas |
|:----------|:----|:------|
| **Minimax** | [Minimax Platform](https://platform.minimax.io/) | Modelos avanzados, API compatible |
| **Groq** | [Groq Console](https://console.groq.com/) | Muy rápido, límite de requests |
| **Ollama** | [ollama.com](https://ollama.com/) | 100% local, sin límites, requiere GPU |

---

## 📡 Endpoints de la API

Todos los endpoints (excepto Auth) requieren el header `Authorization: Bearer <token>`.

### Auth (`/api/v1/auth`)

| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| `POST` | `/register` | Registrar nuevo usuario |
| `POST` | `/login` | Iniciar sesión (devuelve JWT) |
| `GET` | `/me` | Obtener datos del usuario actual |

### Facturas (`/api/v1/facturas`)

| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| `GET` | `/` | Listar facturas (filtros: `tipo`, `estado`, `search`) |
| `POST` | `/` | Crear factura manualmente |
| `POST` | `/upload` | Subir PDF → extracción con IA |
| `GET` | `/:id` | Obtener factura por ID |
| `PUT` | `/:id` | Actualizar factura |
| `DELETE` | `/:id` | Eliminar factura |

### Contactos (`/api/v1/contactos`)

| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| `GET` | `/` | Listar contactos (filtros: `tipo`, `search`) |
| `GET` | `/stats` | Estadísticas: total, clientes, proveedores, facturado |
| `POST` | `/` | Crear contacto (cliente o proveedor) |
| `GET` | `/:id` | Obtener contacto por ID |
| `PUT` | `/:id` | Actualizar contacto |
| `DELETE` | `/:id` | Eliminar contacto (soft delete) |

### IA (`/api/v1/ia`)

| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| `POST` | `/chat` | Enviar pregunta al asistente IA (con RAG) |
| `GET` | `/status` | Estado de los proveedores de IA disponibles |

### Empresas (`/api/v1/empresas`)

| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| `GET` | `/me` | Obtener datos de la empresa del usuario |
| `PUT` | `/me` | Actualizar configuración de la empresa |

### Reportes (`/api/v1/reportes`)

| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| `GET` | `/resumen` | Informe financiero completo |
| `GET` | `/categorias` | Desglose por categorías |

### Health Check

| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| `GET` | `/health` | Estado del servidor |

---

## 🤖 Sistema de IA

### Arquitectura Multi-Proveedor

El servicio de IA (`src/ia/ia.service.ts`) implementa un patrón de **fallback automático**:

```
Petición de IA
     │
     ▼
¿Groq API Key configurada?
     │── Sí → Usar Groq (llama3)
     │── No ──▶ ¿Minimax API Key configurada?
                  │── Sí → Usar Minimax (M2-her)
                  │── No ──▶ ¿Ollama disponible?
                               │── Sí → Usar Ollama (modelo local)
                               │── No → Error: sin proveedor disponible
```

### RAG (Retrieval-Augmented Generation)

El servicio RAG (`src/ia/rag.service.ts`) inyecta contexto financiero real en cada consulta:

1. **Recupera** las facturas, clientes y datos de la empresa.
2. **Construye** un prompt enriquecido con el estado financiero actual.
3. **Envía** el prompt a la IA para que responda con datos reales (no alucinaciones).

### Ingestion Service (Extracción de PDFs)

El servicio de ingestión (`src/ia/ingestion.service.ts`) automatiza:

1. Recibe el PDF subido.
2. Extrae el texto con `pdf-parse`.
3. Envía el texto a la IA con un prompt estructurado.
4. La IA devuelve los datos en formato JSON: emisor, importe, fecha, categoría, etc.
5. Se crea la factura automáticamente y se asocia (o crea) al cliente/proveedor.

---

---

## 💾 Base de datos

El proyecto utiliza **PostgreSQL** como motor de base de datos relacional y **Prisma** como ORM (Object-Relational Mapping). Esta combinación proporciona integridad referencial, tipos fuertes en TypeScript y un sistema de migraciones robusto.

### Esquema Prisma (`prisma/schema.prisma`)

El esquema de la base de datos se define mediante el lenguaje de modelado de Prisma. Las tablas principales son:

- **Empresas**: Entidad de más alto nivel para multi-tenencia.
- **Usuarios**: Usuarios asociados a una empresa con roles específicos.
- **Clientes**: Contactos (clientes y proveedores) asociados a la empresa.
- **Facturas**: Documentos financieros con emisor, receptor, totales e información de extracción IA.
- **Pagos**: Registro de transacciones asociadas a las facturas.

### Acceso a datos (Prisma Client)

La interacción con la base de datos se realiza a través de un cliente único exportado en `src/database/db.ts`:

```typescript
import { prisma } from '../database/db';

// Ejemplo: Buscar facturas por empresa
const facturas = await prisma.factura.findMany({
    where: { empresaId },
    include: { cliente: true }
});
```

---

## 🔑 Autenticación y roles

El sistema usa **JWT** (JSON Web Tokens) con los siguientes roles:

| Rol | Permisos |
|:----|:---------|
| `super_admin` | Acceso total, puede ver todas las empresas |
| `admin` | Gestión completa de su empresa |
| `contador` | Gestión de facturas y reportes |
| `usuario` | Solo lectura |

El middleware `auth.middleware.ts` verifica el token JWT en cada petición protegida y adjunta los datos del usuario a `req.user`.

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar un test específico
npx jest --testPathPattern=security

# Ejecutar con cobertura
npx jest --coverage
```

### Tests disponibles

| Archivo | Descripción |
|:--------|:------------|
| `security.test.ts` | Verifica autenticación JWT, registro, login, protección de rutas no autenticadas |
| `ai-extraction.test.ts` | Verifica la extracción de datos desde texto de facturas |
| `ia-rag-deep-dive.test.ts` | Verifica el contexto RAG y la calidad de respuestas de la IA |

---

## 📜 Scripts disponibles

| Script | Comando | Descripción |
|:-------|:--------|:------------|
| `dev` | `npm run dev` | Inicia el servidor con hot-reload (ts-node-dev) |
| `build` | `npm run build` | Compila TypeScript a JavaScript (carpeta `dist/`) |
| `start` | `npm start` | Inicia el servidor compilado (producción) |
| `test` | `npm test` | Ejecuta los tests con Jest |
| `seed` | `npm run seed` | Puebla la base de datos con datos de prueba |
| `test:ia` | `npm run test:ia` | Prueba la conexión con los proveedores de IA |

---

## 📁 Estructura de archivos

```
backend/
├── .env                        # Variables de entorno (no en git)
├── .env-ejemplo                # Plantilla de variables de entorno
├── docker-compose.yml          # Infraestructura PostgreSQL (opcional aquí)
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Configuración TypeScript
├── prisma/                     # Configuración de Prisma
│   ├── schema.prisma           # Modelado de datos
│   └── migrations/             # Historial de cambios en la DB
│
└── src/
    ├── index.ts                # Punto de entrada
    ├── app.ts                  # Configuración Express
    │
    ├── auth/                   # Módulo de Autenticación
    ├── empresas/               # Módulo de Empresas
    ├── clientes/               # Módulo de Contactos
    ├── facturas/               # Módulo de Facturas
    ├── reportes/               # Módulo de Reportes
    ├── ia/                     # Servicios de IA y RAG
    │
    ├── database/               # Capa de Persistencia
    │   ├── db.ts               # Instancia de Prisma Client
    │   └── index.ts            # Wrapper de compatibilidad (opcional)
    │
    ├── types/                  # Interfaces TypeScript
    ├── scripts/                # Seed y utilidades (Prisma)
    └── tests/                  # Tests (Gest, Supertest)
```

---

<p align="center">
  📖 <a href="../README.md">← Volver a la documentación general</a>
</p>
```
