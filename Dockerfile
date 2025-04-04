# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies without running scripts
RUN npm install --ignore-scripts

# Copy the rest of the source code
COPY . .

# Build the project
RUN npm run build

# Expose port if needed (currently not specified, adjust if necessary)

# Set default command to start the MCP server
CMD ["node", "build/index.js"]
