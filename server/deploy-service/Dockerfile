FROM node:18-alpine

# Install git for cloning repositories
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create output directory
RUN mkdir -p dist/output

CMD ["npm", "start"]