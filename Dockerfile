FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    STORAGE_PATH=/data/uploads

RUN mkdir -p /data/uploads

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

CMD ["node", "src/index.js"]
