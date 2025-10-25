FROM node:18-alpine

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

EXPOSE 5500

CMD ["npm", "start"]