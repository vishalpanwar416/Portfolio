FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]   
