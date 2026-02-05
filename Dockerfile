# Stage 1: Build the React Frontend
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# Stage 2: Final Production Image
FROM node:22-alpine
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend --only=production

# Copy backend source
COPY backend/ ./backend/

# IMPORTANT: Copy the built frontend into the correct relative path
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# Set environment to production
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "backend/server.js"]