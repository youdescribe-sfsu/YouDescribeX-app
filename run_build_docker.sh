#!/bin/bash

# Load environment variables
source .env

echo $IMAGE_NAME

# Build the Docker image
docker build  --build-arg APP_PORT=$PORT -t "${IMAGE_NAME}:${IMAGE_TAG}" .

# Run the Docker container
# docker compose --env-file .env up
