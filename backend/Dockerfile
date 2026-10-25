# Use lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start server using npm start
CMD ["npm", "start"]
