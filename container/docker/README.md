# Docker

## Table of Content

- [Docker](#docker)
  - [Table of Content](#table-of-content)
  - [Image Layers](#image-layers)
  - [Cached](#cached)

## Image Layers

- Each layer is an image itself, just one without a human-assigned tag. They have auto-generated IDs though.
- Each layer stores the changes compared to the image it's based on.
- An image can consist of a single layer (that's often the case when the squash command was used).
- Each instruction in a Dockerfile results in a layer. (Except for multi-stage builds, where usually only the layers in the final image are pushed, or when an image is squashed to a single layer).
- Layers are used to avoid transferring redundant information and skip build steps which have not changed (according to the Docker cache).

## Cached

- Its parent image exists in the cache
- The Dockerfile instruction corresponding to the layer is unchanged (or in case of ADD/COPY, the involved files are exactly the same)
- Cache Gotcha #1: `RUN apt-get update`
- Using the Cache Well: it is better to update the package management files (`package.json` & `requirements.txt`), you only have to do it once.
