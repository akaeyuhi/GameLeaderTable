# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# install deps
COPY frontend/package*.json frontend/tsconfig.json frontend/vite.config.ts ./
RUN npm install

# copy source & build
COPY frontend/ ./
RUN npm run build        # assumes "build": "vite build"

EXPOSE 4173
EXPOSE 5173
ENV VITE_WS_URL=ws://localhost:3001

# run preview server for production build, listening on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
