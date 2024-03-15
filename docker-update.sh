#!/bin/sh

# we take an arg as the semantic versioning
VERSION=$1

# we take the image name to tag
IMAGE_NAME=$2

# we build the image
# docker-compose build

# we tag the image
docker tag "$IMAGE_NAME":latest "$IMAGE_NAME":"$VERSION"

# we push the image
docker push "$IMAGE_NAME":"$VERSION"
docker push "$IMAGE_NAME":latest
