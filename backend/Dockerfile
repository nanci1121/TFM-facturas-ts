# ============================================================
# Stage 1: Builder — instala dependencias y compila TypeScript
# ============================================================
FROM node:20-slim AS builder

# Instalar OpenSSL (necesario para Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias primero (mejor caché de capas)
COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Generar el cliente Prisma
# En arquitectura virtual sin AVX, a veces es mejor usar el binario de Linux musl/deb nativo
RUN npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# ============================================================
# Stage 2: Production — imagen final ligera
# ============================================================
FROM node:20-slim AS production

# Instalar OpenSSL (necesario para Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar solo dependencias de producción
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# Generar el cliente Prisma en la imagen de producción
RUN npx prisma generate

# Copiar el código compilado desde el builder
COPY --from=builder /app/dist ./dist

# Crear directorio para uploads (se montará como volumen)
RUN mkdir -p uploads/facturas/procesadas

# Exponer el puerto de la API
EXPOSE 3001

# Script de inicio: ejecutar migraciones y luego arrancar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
