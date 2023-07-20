# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Install the application dependencies
RUN npm install

RUN echo "REACT_APP_LOGROCKET_ID $REACT_APP_LOGROCKET_ID"
RUN echo "REACT_APP_YDX_BACKEND_URL=$REACT_APP_YDX_BACKEND_URL"

# Build the application
RUN npm run build

# Remove the Node modules
# RUN rm -rf node_modules

# Install the production dependencies
RUN npm install express http-proxy

# Remove the development dependencies
RUN npm prune --production

ARG APP_PORT
ENV APP_PORT=${APP_PORT}

# Expose the specified port
EXPOSE ${APP_PORT}

# Start the application
CMD [ "node", "server.js"]
