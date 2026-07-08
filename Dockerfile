# Build stage
FROM node:20 AS build
WORKDIR /app

# Install full dependencies for build
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and run build (uncomment if you have a build step)
COPY . ./
# RUN npm run build

# Runtime stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only package files and install production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy runtime artifacts from build stage. If you build into dist/, adjust accordingly.
# If you don't run a build step, this copies the app sources.
COPY --from=build /app .

# Use a non-root user for security
USER node

EXPOSE 3000
CMD ["npm", "start"]
