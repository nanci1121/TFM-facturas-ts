# ============================================================
# Stage 1: Builder — instala dependencias y compila el proyecto
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias primero (mejor caché de capas)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar el proyecto React con Vite (genera la carpeta dist/)
# VITE_API_URL apunta al backend en producción
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ============================================================
# Stage 2: Production — Nginx sirve los archivos estáticos
# ============================================================
FROM nginx:alpine AS production

# Copiar los archivos compilados al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
