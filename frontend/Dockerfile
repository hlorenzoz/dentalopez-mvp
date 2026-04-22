FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install --legacy-peer-deps

FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node_modules/.bin/next", "dev"]

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["bun", "server.js"]
