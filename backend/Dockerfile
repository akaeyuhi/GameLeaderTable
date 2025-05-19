# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# install deps
COPY backend/package*.json backend/tsconfig.json ./
RUN npm install

# copy source & build
COPY backend/src/ ./src/
RUN npm run build        # assumes "build": "tsc" in package.json

EXPOSE 3001
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

CMD ["npm", "run", "start:built", "--", "--host", "0.0.0.0"]
