FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.output ./.output
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/server/db/migrate.mjs ./server/db/migrate.mjs
COPY --from=build /app/server/db/seed.mjs ./server/db/seed.mjs
COPY --from=build /app/node_modules ./node_modules
USER app
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
