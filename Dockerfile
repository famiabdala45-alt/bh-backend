FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user before copying files
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy application code
COPY . .

# Set ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
