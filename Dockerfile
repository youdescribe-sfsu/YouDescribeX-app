# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Set environment variables directly in the Dockerfile
ENV REACT_APP_LOGROCKET_ID=your_logrocket_id
ENV REACT_APP_ENVIRONMENT=your_environment
ENV REACT_APP_REDIRECT_URL=your_redirect_url
ENV REACT_APP_YOUTUBE_API_URL=your_youtube_api_url
ENV REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
ENV REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
ENV REACT_APP_USE_YDX=your_ydx
ENV REACT_APP_YDX_BACKEND_URL=your_ydx_backend_url
ENV REACT_APP_CLASSIC_BACKEND_URL=your_classic_backend_url
ENV REACT_APP_CLASSIC_BACKEND_URL_VERSION=your_classic_backend_url_version
ENV PORT=your_port

# Create the .env file during the build process
RUN echo "REACT_APP_LOGROCKET_ID=$REACT_APP_LOGROCKET_ID" > .env
RUN echo "REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT" >> .env
RUN echo "REACT_APP_REDIRECT_URL=$REACT_APP_REDIRECT_URL" >> .env
RUN echo "REACT_APP_YOUTUBE_API_URL=$REACT_APP_YOUTUBE_API_URL" >> .env
RUN echo "REACT_APP_YOUTUBE_API_KEY=$REACT_APP_YOUTUBE_API_KEY" >> .env
RUN echo "REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID" >> .env
RUN echo "REACT_APP_USE_YDX=$REACT_APP_USE_YDX" >> .env
RUN echo "REACT_APP_YDX_BACKEND_URL=$REACT_APP_YDX_BACKEND_URL" >> .env
RUN echo "REACT_APP_CLASSIC_BACKEND_URL=$REACT_APP_CLASSIC_BACKEND_URL" >> .env
RUN echo "REACT_APP_CLASSIC_BACKEND_URL_VERSION=$REACT_APP_CLASSIC_BACKEND_URL_VERSION" >> .env
RUN echo "PORT=$PORT" >> .env

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
