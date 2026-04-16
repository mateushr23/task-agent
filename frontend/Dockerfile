# Stage 1 — Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Stage 2 — Build
FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Stage 3 — Production
FROM node:22-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
