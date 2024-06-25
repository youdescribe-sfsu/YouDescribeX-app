# Use the official Node.js image with the latest version
FROM node:latest

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build arguments for environment-specific variables
ARG REACT_APP_ENVIRONMENT
ARG REACT_APP_REDIRECT_URL
ARG REACT_APP_YDX_BACKEND_URL

# Set environment variables
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV REACT_APP_REDIRECT_URL=$REACT_APP_REDIRECT_URL
ENV REACT_APP_YDX_BACKEND_URL=$REACT_APP_YDX_BACKEND_URL

# Build the application
RUN npm run build

# Expose the application port
EXPOSE $PORT

# Start the application
CMD [ "node", "server.js"]