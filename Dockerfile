# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:18-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Final image ─────────────────────────────────────────────────────
FROM node:18-slim
WORKDIR /app

# Install Ghostscript (lightweight install, no extras)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ghostscript \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Copy dependencies + source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Railway injects $PORT at runtime; expose a default for local dev
EXPOSE 3000

# Health-check so Railway knows the container is alive
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/health',r=>{process.exit(r.statusCode===200?0:1)})"

CMD ["node", "app.js"]
