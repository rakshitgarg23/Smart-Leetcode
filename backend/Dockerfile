# Use Node.js 22 LTS Alpine image to get native WebSocket support built-in
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install Python and g++ for local code execution support
RUN apk add --no-cache python3 g++ build-base

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose port (Render sets the PORT environment variable)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
