# SIGAE en la nube (Railway u otro servicio con Docker): una sola imagen que
# sirve la app compilada, la API y las fotos en el mismo puerto ($PORT).
# Al arrancar, scripts/prepararBaseNube.js carga la base inicial si está vacía.
FROM node:22-bookworm-slim

# Chromium del sistema para exportar horarios a PNG (Puppeteer) y fuentes para el PDF/PNG
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-dejavu-core fonts-liberation ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 1. Dependencias (en capas aparte para reutilizarlas si solo cambia el código)
COPY webSIGAE/FrontEnd/package.json webSIGAE/FrontEnd/package-lock.json webSIGAE/FrontEnd/
RUN cd webSIGAE/FrontEnd && npm ci --no-audit --no-fund
COPY webSIGAE/BackEnd/package.json webSIGAE/BackEnd/package-lock.json webSIGAE/BackEnd/
RUN cd webSIGAE/BackEnd && npm ci --omit=dev --no-audit --no-fund

# 2. Compilar la app (misma dirección que la API: /api relativo, base /)
COPY webSIGAE/FrontEnd webSIGAE/FrontEnd
RUN cd webSIGAE/FrontEnd && VITE_BASE=/ npm run build && rm -rf node_modules

# 3. Backend y base de datos inicial
COPY webSIGAE/BackEnd webSIGAE/BackEnd
COPY webSIGAE/Database webSIGAE/Database

# Fotos de perfil en /data/uploads: en Railway, monta un volumen en /data para no perderlas
ENV SERVIR_FRONTEND=1 \
    UPLOADS_DIR=/data/uploads
WORKDIR /app/webSIGAE/BackEnd
CMD ["sh", "-c", "node scripts/prepararBaseNube.js && node server.js"]
