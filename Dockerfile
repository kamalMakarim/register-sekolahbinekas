# ===========================
# 1️⃣ Build Stage
# ===========================
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the Next.js app
RUN npm run build

# ===========================
# 2️⃣ Production Stage
# ===========================
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the necessary build output from the builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

# Install only production dependencies
RUN npm install --omit=dev

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Run the Next.js app
CMD ["npm", "start"]
