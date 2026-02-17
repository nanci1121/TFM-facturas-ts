<![CDATA[# 🎨 FacturaIA — Frontend

Interfaz web moderna construida con **React 18 + Vite + TypeScript + Tailwind CSS**, con diseño responsive, modo oscuro y una experiencia de usuario intuitiva para la gestión de facturas e IA conversacional.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Páginas y navegación](#-páginas-y-navegación)
- [Componentes](#-componentes)
- [Estado global](#-estado-global)
- [Servicios HTTP](#-servicios-http)
- [Estilos y diseño](#-estilos-y-diseño)
- [Testing](#-testing)
- [Scripts disponibles](#-scripts-disponibles)
- [Estructura de archivos](#-estructura-de-archivos)

---

## ✨ Características

- 🌙 **Modo oscuro/claro** con persistencia en localStorage
- 📊 **Dashboard interactivo** con KPIs y gráficos (Recharts)
- 🧾 **Doble flujo de facturas**: gastos (PDFs subidos) e ingresos (creación manual)
- 📇 **Gestión unificada** de clientes y proveedores con tabs y búsqueda
- 🤖 **Chat con IA** en lenguaje natural (consultas financieras)
- 🔐 **Autenticación completa** con JWT y protección de rutas
- 📱 **Diseño responsive** para escritorio y tablets
- ⚡ **Hot Module Replacement** para desarrollo ultrarrápido con Vite

---

## 🛠️ Stack tecnológico

| Paquete | Versión | Propósito |
|:--------|:--------|:----------|
| `react` | 18.2 | Biblioteca UI con hooks y componentes funcionales |
| `react-dom` | 18.2 | Renderizado DOM |
| `react-router-dom` | 6.20 | Navegación SPA con rutas protegidas |
| `vite` | 5.0 | Build tool con HMR ultrarrápido |
| `typescript` | 5.x | Tipado estático completo |
| `tailwindcss` | 3.3 | Framework CSS utility-first |
| `zustand` | 4.4 | Gestión de estado global (ligero, sin boilerplate) |
| `axios` | 1.6 | Cliente HTTP para comunicación con el backend |
| `recharts` | 2.10 | Gráficos SVG (barras, líneas, áreas) |
| `lucide-react` | 0.294 | Iconos SVG consistentes y personalizables |
| `date-fns` | 2.30 | Formateo y manipulación de fechas |
| `clsx` + `tailwind-merge` | 2.x | Utilidades para clases CSS condicionales |
| `vitest` | 4.x | Testing unitario compatible con Vite |
| `@testing-library/react` | 16.x | Testing de componentes React |

---

## 🚀 Instalación

```bash
# Desde la raíz del proyecto
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en **http://localhost:3000**

> ⚠️ **Requisito**: El backend debe estar corriendo en `http://localhost:3001` para que la aplicación funcione correctamente.

---

## ⚙️ Configuración

### Proxy API

El frontend está configurado para redirigir las llamadas API al backend. En `vite.config.ts`:

```ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001'
    }
  }
})
```

Esto permite hacer llamadas como `api.get('/contactos')` sin preocuparse por CORS ni la URL del backend.

---

## 🗺️ Páginas y navegación

El sistema de rutas está definido en `App.tsx` usando React Router v6 con rutas protegidas:

| Ruta | Componente | Descripción |
|:-----|:-----------|:------------|
| `/login` | `Login.tsx` | Inicio de sesión (pública) |
| `/` | `Dashboard.tsx` | Panel de control con KPIs y gráficos |
| `/facturas` | `Facturas.tsx` | Gestión de facturas (gastos e ingresos) |
| `/contactos` | `Clientes.tsx` | Gestión de clientes y proveedores |
| `/ia` | `IAChat.tsx` | Asistente de IA conversacional |
| `/settings` | `Configuracion.tsx` | Configuración de la empresa e IA |
| `/reportes` | — | Reportes (en desarrollo) |

### Flujo de navegación

```
┌────────────────────────────────────────────────┐
│                   Layout                        │
│  ┌──────────┐  ┌───────────────────────────┐   │
│  │          │  │        Header Bar          │   │
│  │          │  │  (tema, usuario, logout)   │   │
│  │ Sidebar  │  ├───────────────────────────┤   │
│  │          │  │                           │   │
│  │ Dashboard│  │     CONTENIDO DINÁMICO    │   │
│  │ Facturas │  │                           │   │
│  │ Contactos│  │     (React Router)        │   │
│  │ IA Chat  │  │                           │   │
│  │ Reportes │  │                           │   │
│  │ Config   │  │                           │   │
│  │          │  │                           │   │
│  └──────────┘  └───────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### Protección de rutas

Todas las rutas (excepto `/login`) están protegidas por el componente `ProtectedRoute`:

```tsx
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};
```

---

## 🧩 Componentes

### Páginas (`src/pages/`)

#### `Dashboard.tsx`
- Tarjetas KPI: Total facturado, pendiente de cobro, vencido, balance neto
- Gráfico de evolución mensual (ingresos vs gastos)
- Top 5 categorías de gasto
- Distribución de facturas por tipo
- Alertas de facturas vencidas

#### `Facturas.tsx`
- Tabs: Todas, Gastos, Ingresos
- Buscador integrado con filtros avanzados
- Tabla con columnas: Tipo, Número, Emisor/Cliente, Categoría, Fecha, Total, Origen IA, Estado
- Menú de acciones: Ver PDF, Editar datos, Eliminar
- Modal de subida de PDF (extracción con IA)

#### `Clientes.tsx` (ruta `/contactos`)
- KPIs: Total contactos, Clientes, Proveedores, Facturado
- Tabs: Todos, Clientes, Proveedores
- Buscador por nombre, NIF/CIF o email
- Tabla con badges de tipo (Cliente en azul, Proveedor en naranja)
- Modal de creación/edición con toggle de tipo
- Confirmación de eliminación (soft delete)

#### `IAChat.tsx`
- Interfaz de chat estilo mensajería
- Envía consultas al servicio de IA con RAG
- Muestra proveedor usado (Groq, Minimax, Ollama)
- Animación de escritura durante la respuesta

#### `Configuracion.tsx`
- Datos de la empresa
- Selección de proveedor de IA
- Configuración de claves API
- Preferencias de moneda e impuestos

#### `Login.tsx`
- Formulario de inicio de sesión
- Validación de campos
- Redirección automática tras login exitoso
- Diseño con gradiente y glassmorphism

### Componentes reutilizables (`src/components/`)

| Componente | Descripción |
|:-----------|:------------|
| `Layout.tsx` | Layout principal con sidebar, header y zona de contenido |
| `Sidebar.tsx` | Barra de navegación lateral con iconos y resaltado activo |
| `CrearFacturaModal.tsx` | Modal completo para crear facturas de ingreso con items, totales e IVA |

---

## 🗃️ Estado global

La aplicación usa **Zustand** para la gestión de estado, con dos stores:

### `authStore.ts` — Autenticación

```ts
interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}
```

- Persiste el token en `localStorage`
- Se hidrata al cargar la aplicación
- `logout()` limpia token y redirige al login

### `themeStore.ts` — Tema visual

```ts
interface ThemeState {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}
```

- Persiste el tema en `localStorage`
- Aplica la clase `dark` al `<html>` para activar Tailwind dark mode
- Detecta preferencia del sistema al inicio

---

## 🌐 Servicios HTTP

El cliente HTTP está centralizado en `src/services/api.ts`:

```ts
const api = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor: adjunta token JWT a cada petición
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
```

### Endpoints consumidos

| Módulo | Método | Endpoint |
|:-------|:-------|:---------|
| Auth | POST | `/auth/login` |
| Auth | GET | `/auth/me` |
| Facturas | GET | `/facturas` |
| Facturas | POST | `/facturas` |
| Facturas | POST | `/facturas/upload` |
| Facturas | PUT/DELETE | `/facturas/:id` |
| Contactos | GET | `/contactos` |
| Contactos | GET | `/contactos/stats` |
| Contactos | POST/PUT/DELETE | `/contactos/:id` |
| IA | POST | `/ia/chat` |
| Empresa | GET/PUT | `/empresas/me` |
| Reportes | GET | `/reportes/resumen` |

---

## 🎨 Estilos y diseño

### Tailwind CSS

La aplicación usa Tailwind CSS 3 con la configuración en `tailwind.config.js`:

- **Dark mode**: Activado con la clase `dark` (`darkMode: 'class'`)
- **Colores**: Paleta estándar de Tailwind con personalizaciones
- **Tipografía**: Fuente por defecto del sistema

### Principios de diseño

1. **Glassmorphism**: Usado en cards y modales con fondos semitransparentes
2. **Gradientes**: En avatares, badges y botones principales
3. **Micro-animaciones**: Transiciones suaves en hover, apertura de menús y cargas
4. **Responsive**: Grid adaptativo que funciona en pantallas de 768px+
5. **Accesibilidad**: Contraste adecuado en ambos temas (claro y oscuro)

### Paleta de colores semántica

| Color | Uso |
|:------|:----|
| 🔵 Azul (`blue-500/600`) | Clientes, ingresos, acciones principales |
| 🟠 Naranja (`orange-500/600`) | Proveedores, gastos |
| 🟢 Verde (`emerald-500/600`) | Importes positivos, estados activos |
| 🔴 Rojo (`red-500/600`) | Eliminación, importes negativos, vencido |
| 🟣 Púrpura (`purple-500/600`) | Categorías, badges informativos |
| ⚫ Gris (`gray-100...900`) | Fondos, bordes, texto secundario |

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con interfaz visual
npx vitest --ui

# Ejecutar en modo watch (desarrollo)
npx vitest

# Ejecutar con cobertura
npx vitest --coverage
```

### Tests incluidos

| Archivo | Descripción |
|:--------|:------------|
| `Sidebar.test.tsx` | Verifica que la navegación se renderiza con todos los enlaces correctos |

### Herramientas de testing

- **Vitest**: Runner compatible con Vite, configuración nativa ESM
- **@testing-library/react**: Renderizado de componentes con enfoque en usuario
- **@testing-library/user-event**: Simulación de eventos del usuario
- **jsdom**: Entorno DOM para tests Node.js

---

## 📜 Scripts disponibles

| Script | Comando | Descripción |
|:-------|:--------|:------------|
| `dev` | `npm run dev` | Servidor de desarrollo con HMR (puerto 3000) |
| `build` | `npm run build` | Compila TypeScript + build de producción (carpeta `dist/`) |
| `preview` | `npm run preview` | Previsualiza el build de producción localmente |
| `lint` | `npm run lint` | Analiza código con ESLint |
| `test` | `npm test` | Ejecuta tests con Vitest |

---

## 📁 Estructura de archivos

```
frontend/
├── index.html                  # HTML raíz (punto de entrada Vite)
├── package.json                # Dependencias y scripts
├── vite.config.ts              # Configuración de Vite (proxy, puerto)
├── tailwind.config.js          # Configuración de Tailwind CSS
├── postcss.config.js           # PostCSS (autoprefixer + Tailwind)
├── tsconfig.json               # Configuración TypeScript
├── eslint.config.js            # Configuración ESLint
│
└── src/
    ├── main.tsx                # Punto de entrada React (ReactDOM.render)
    ├── App.tsx                 # Rutas, ProtectedRoute, Layout wrapper
    ├── index.css               # Estilos globales + imports de Tailwind
    │
    ├── pages/                  # Páginas (una por ruta)
    │   ├── Login.tsx           # Inicio de sesión
    │   ├── Dashboard.tsx       # Panel de control con KPIs
    │   ├── Facturas.tsx        # Gestión de facturas
    │   ├── Clientes.tsx        # Contactos (clientes + proveedores)
    │   ├── IAChat.tsx          # Asistente de IA conversacional
    │   └── Configuracion.tsx   # Configuración de empresa e IA
    │
    ├── components/             # Componentes reutilizables
    │   ├── Layout.tsx          # Layout principal (sidebar + header + content)
    │   ├── Sidebar.tsx         # Barra de navegación lateral
    │   ├── Sidebar.test.tsx    # Test del Sidebar
    │   └── CrearFacturaModal.tsx  # Modal de creación de facturas
    │
    ├── services/               # Comunicación con el backend
    │   └── api.ts              # Cliente axios con interceptores JWT
    │
    ├── store/                  # Estado global (Zustand)
    │   ├── authStore.ts        # Estado de autenticación
    │   └── themeStore.ts       # Estado del tema (dark/light)
    │
    └── test/                   # Configuración de tests
        └── setup.ts            # Setup global para Vitest
```

---

## 🔧 Configuración avanzada

### Cambiar puerto del frontend

En `vite.config.ts`:

```ts
server: {
    port: 3000  // Cambiar al puerto deseado
}
```

### Apuntar a otro backend

En `vite.config.ts`, modifica el proxy:

```ts
proxy: {
    '/api': 'http://tu-servidor-backend:3001',
    '/uploads': 'http://tu-servidor-backend:3001'
}
```

### Build de producción

```bash
npm run build    # Genera la carpeta dist/
npm run preview  # Sirve el build localmente para verificar
```

El resultado en `dist/` puede desplegarse en cualquier servidor estático (Nginx, Apache, Vercel, Netlify, etc.).

---

<p align="center">
  📖 <a href="../README.md">← Volver a la documentación general</a>
</p>
]]>
