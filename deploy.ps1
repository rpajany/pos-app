#!/bin/bash

# 1. Define the version (Pass it as an argument, or default to 'v1.0')
VERSION=${1:-v1.0}
IMAGE_NAME="rpajany/pos-app"

echo "🚀 Starting build for version: $VERSION..."

# 2. Build the image with the specific version tag
docker build -t $IMAGE_NAME:$VERSION .

# 3. Tag it as 'latest' as well
echo "🏷️  Tagging as latest..."
docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest

# 4. Push both tags to Docker Hub
echo "☁️  Pushing to Docker Hub..."
docker push $IMAGE_NAME:$VERSION
docker push $IMAGE_NAME:latest

echo "✅ Successfully deployed $IMAGE_NAME:$VERSION and updated :latest"