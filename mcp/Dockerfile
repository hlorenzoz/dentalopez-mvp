FROM node:22-alpine AS base
RUN apk add --no-cache npm
WORKDIR /app

FROM base AS dev
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "tsx", "src/index.ts"]

FROM base AS build
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npx tsc --project tsconfig.json

FROM base AS prod
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
