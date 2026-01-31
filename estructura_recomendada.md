/sistema-facturas/
├── /backend/
│   ├── src/
│   │   ├── auth/         # JWT, login, roles
│   │   ├── empresas/     # Multi-tenant
│   │   ├── clientes/     # CRUD clientes
│   │   ├── facturas/     # CRUD + pagos
│   │   ├── ia/           # 🤖 Dual: local/api + RAG
│   │   ├── reportes/     # Estadísticas
│   │   ├── database/     # JSON/SQLite
│   │   ├── middleware/   # Auth, validación
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── /frontend/
├── src/
│   ├── components/   # UI reutilizable
│   ├── pages/        # Dashboard, Facturas, etc.
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API calls
│   ├── store/        # Estado global
│   └── App.tsx
└── package.json


---

## 📡 API ENDPOINTS (Backend)

### AUTH
POST /api/v1/auth/login          → {email, password} → {token, user}
GET  /api/v1/auth/profile        → Bearer token → {user}
POST /api/v1/auth/register       → {email, password, nombre, rol} → {user}

### EMPRESAS (Multi-tenant)
GET  /api/v1/empresas                    → Lista empresas
POST /api/v1/empresas                    → Crear empresa
GET  /api/v1/empresas/:id                → Detalle empresa
PUT  /api/v1/empresas/:id                → Actualizar
GET  /api/v1/empresas/:id/stats          → Estadísticas
GET  /api/v1/empresas/:id/next-folio     → Siguiente número factura

### CLIENTES
GET    /api/v1/clientes?empresaId=&search=   → Listar con filtros
POST   /api/v1/clientes                      → Crear
GET    /api/v1/clientes/:id                  → Detalle + estadísticas
PUT    /api/v1/clientes/:id                  → Actualizar
DELETE /api/v1/clientes/:id                  → Soft delete

### FACTURAS
GET    /api/v1/facturas?estado=&page=        → Listar paginado
POST   /api/v1/facturas                      → Crear con items[]
GET    /api/v1/facturas/:id                  → Detalle completo
PUT    /api/v1/facturas/:id                  → Actualizar (solo borrador)
PATCH  /api/v1/facturas/:id/status           → Cambiar estado
POST   /api/v1/facturas/:id/pagos            → Registrar pago
DELETE /api/v1/facturas/:id                  → Eliminar (solo borrador)

### IA (🤖 DUAL)
POST /api/v1/ia/chat                 → {message, useRAG} → {response, provider}
POST /api/v1/ia/analyze-invoice      → {facturaId} → {analysis}
POST /api/v1/ia/financial-summary    → {periodo} → {summary}
GET  /api/v1/ia/status               → {providers: [{name, available}]}
POST /api/v1/ia/reindex              → Reconstruir índice RAG

### REPORTES
GET /api/v1/reportes/resumen                → KPIs financieros
GET /api/v1/reportes/estadisticas-mensuales → Datos para gráficas
GET /api/v1/reportes/top-clientes           → Ranking clientes
GET /api/v1/reportes/por-vencer?dias=7      → Alertas de cobranza
GET /api/v1/reportes/vencidas               → Facturas vencidas
GET /api/v1/reportes/export                 → JSON para Excel


---

## 🗄️ MODELOS DE DATOS

```typescript
// types/index.ts

interface Usuario {
  id: string;
  email: string;
  password: string; // hashed
  nombre: string;
  apellido: string;
  rol: 'super_admin' | 'admin' | 'contador' | 'usuario';
  empresaId: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Empresa {
  id: string;
  nombre: string;
  rfc: string;
  direccion: string;
  telefono: string;
  email: string;
  configuracion: {
    monedaDefault: string;
    impuestoDefault: number;
    prefijoFactura: string;
    numeracionActual: number;
    iaProvider: 'local' | 'api' | 'auto';
  };
  activa: boolean;
}

interface Cliente {
  id: string;
  empresaId: string;
  nombre: string;
  rfc: string;
  direccion: string;
  telefono: string;
  email: string;
  contacto: string;
  notas: string;
  activo: boolean;
}

type EstadoFactura = 'borrador' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada' | 'parcial';

interface Factura {
  id: string;
  empresaId: string;
  clienteId: string;
  numero: string;
  serie: string;
  folio: number;
  fechaEmision: Date;
  fechaVencimiento: Date;
  fechaPago: Date | null;
  estado: EstadoFactura;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  subtotal: number;
  impuestos: number;
  total: number;
  moneda: string;
  notas: string;
  items: ItemFactura[];
  pagos: Pago[];
}

interface ItemFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  impuesto: number;
  total: number;
  unidad: string;
}

interface Pago {
  id: string;
  facturaId: string;
  monto: number;
  fecha: Date;
  metodo: string;
  referencia: string;
}

🤖 SISTEMA IA DUAL + RAG
Configuración (.env)
Copy
# IA
IA_DEFAULT_PROVIDER=auto  # auto | local | api

# Local (Ollama)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# API (Gemini/Google)
GEMINI_API_KEY=AIza...

# RAG
RAG_ENABLED=true
RAG_MAX_RESULTS=5
Lógica de selección (auto)
Copy
1. Si GEMINI_API_KEY configurada → usar Gemini
2. Si no, verificar Ollama disponible → usar local
3. Si ninguno → error con instrucciones
RAG (Contexto verificable)
TypeScript
Copy
// Antes de enviar prompt a IA:
// 1. Buscar documentos relevantes (facturas, clientes)
// 2. Generar contexto: "Cliente X tiene Y facturas pendientes..."
// 3. Incluir en system prompt
// 4. IA responde con datos reales, no inventa
🎨 FRONTEND - PÁGINAS
Dashboard (/)
KPI Cards: Total facturado, pendiente, vencido, clientes
Gráfica línea: Ingresos últimos 12 meses
Gráfica dona: Facturas por estado
Tabla: Facturas recientes
Alertas: Por vencer (7 días), Vencidas
Facturas (/facturas)
Tabla con: Número, Cliente, Fecha, Total, Estado
Filtros: Estado, Fecha, Cliente
Acciones: Ver, Editar, Cambiar estado, Eliminar
Botón: Nueva Factura (modal)
Nueva Factura (/facturas/nueva)
Select: Cliente
Inputs: Fecha emisión, Fecha vencimiento
Tabla dinámica: Items (descripción, cantidad, precio, total)
Totales: Subtotal, Impuestos, Total
Preview antes de guardar
Clientes (/clientes)
Tabla con filtros
Perfil: Datos + historial de facturas
IA Assistant (/ia)
Chat interface tipo ChatGPT
Indicador: "Usando: Gemini" o "Usando: Ollama"
Botones rápidos:
"Analizar factura #123"
"Resumen del mes"
"Clientes con deuda"
Contexto: Menciona datos reales de la empresa
Reportes (/reportes)
Gráficas interactivas (Recharts)
Exportar: Excel, PDF
Filtros por fecha
Settings (/settings)
Configuración IA: Local / API / Auto
Datos empresa
Perfil usuario
🔐 AUTENTICACIÓN Y ROLES
Table
Copy
Rol	Permisos
super_admin	Todo, todas las empresas
admin	Su empresa, usuarios, config
contador	Facturas, reportes, ver clientes
usuario	Crear facturas, ver las suyas
Middleware: authenticate → authorize(roles) → requireEmpresa
📦 DEPENDENCIAS
Backend
JSON
Copy
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0",
    "date-fns": "^2.30.0",
    "@google/generative-ai": "^0.21.0"
  }
}
Frontend
JSON
Copy
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "zustand": "^4.4.0"
  }
}
✅ CRITERIOS DE ACEPTACIÓN
Funcionalidad
[ ] Login funciona con JWT
[ ] CRUD completo de facturas
[ ] Pagos parciales y totales
[ ] Numeración automática de facturas
[ ] Filtros y búsqueda funcionan
IA
[ ] Chat responde con contexto de facturas reales
[ ] Detecta automáticamente Gemini u Ollama
[ ] Fallback graceful si IA no disponible
[ ] No "alucina" datos (usa RAG)
UI
[ ] Dashboard carga < 2s
[ ] Gráficas son interactivas
[ ] Responsive (mobile + desktop)
[ ] Dark mode opcional
🎯 INSTRUCCIONES PARA ANTIGRAVITY
Genera el proyecto completo siguiendo esta especificación:
Crea primero la estructura de carpetas
Implementa backend completo con todos los endpoints
Crea frontend con React y todas las páginas
Integra sistema IA dual con RAG
Añade autenticación JWT
Crea datos de prueba (admin@sistema.com / admin123)
Empezar por: /backend/package.json y /backend/src/index.ts
Copy

---

## 🚀 CÓMO USAR EN ANTIGRAVITY

1. **Abre** [antigravity.google](https://antigravity.google)
2. **Crea nuevo proyecto**
3. **Pega el prompt completo** de arriba
4. **Añade al final:**
@gemini Implementa paso a paso, empezando por el backend.
Confirma cada módulo antes de continuar con el siguiente.
Copy
5. **Revisa y acepta** cada cambio

---

## 💡 TIPS PARA ANTIGRAVITY

| Comando | Efecto |
|---------|--------|
| `@gemini` | Llama a Gemini 2.5 Pro |
| `/explain` | Explica el código seleccionado |
| `/test` | Genera tests |
| `/doc` | Genera documentación |
| `Ctrl+K` | Edición inline con IA |

---

¿Quieres que **genere el prompt en un formato más corto** (para copiar-pegar fácil) o que **añada algo específico** como:
- Tests automatizados
- Docker compose
- CI/CD GitHub Actions
- Documentación Swagger/OpenAPI