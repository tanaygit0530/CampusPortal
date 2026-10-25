# Use lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifests first for optimal caching
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server bound to 0.0.0.0 for external container access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
