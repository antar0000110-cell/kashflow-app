# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Bundle server with esbuild
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY --from=frontend-builder /app/dist ./dist
COPY server.ts ./
COPY server/ ./server/
COPY src/types/ ./src/types/
COPY src/services/mockData.ts ./src/services/mockData.ts
COPY src/utils/formatters.ts ./src/utils/formatters.ts
COPY src/utils/cairoTime.ts ./src/utils/cairoTime.ts
RUN npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=server-builder /app/dist ./dist
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package.json ./

RUN mkdir -p /app/data && chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/server.cjs"]
