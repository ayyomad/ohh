# Frontend image for the `full` profile; Vite dev server inside the container.
FROM node:22-slim

WORKDIR /app

# Copying the lockfile first lets npm ci use Docker's layer cache.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# docker-compose.yml overrides the command with the same action.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
