# ==========================================
# Dockerfile cho React + Vite Frontend
# Multi-stage Build với Nginx
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

# Tiếp nhận biến môi trường khi build (Vite nhúng biến tại thời điểm build)
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_CALL_STAFF_COOLDOWN=30

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_CALL_STAFF_COOLDOWN=$VITE_CALL_STAFF_COOLDOWN

RUN npm run build

# 2. Production Stage (Nginx Alpine siêu nhẹ ~15MB RAM)
FROM nginx:alpine
ENV PORT=80

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
