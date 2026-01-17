#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME=${IMAGE_NAME:-ads-tracker-web}
CACHE_REGISTRY=${CACHE_REGISTRY:-}
CACHE_IMAGE=${CACHE_IMAGE:-}
PUSH=${PUSH:-0}
PLATFORM=${PLATFORM:-linux/amd64}
TARGET=${TARGET:-runner}

if [[ -z "$CACHE_IMAGE" ]]; then
  if [[ -z "$CACHE_REGISTRY" ]]; then
    echo "CACHE_REGISTRY atau CACHE_IMAGE wajib diisi untuk cache remote." >&2
    echo "Contoh: CACHE_REGISTRY=ghcr.io/owner/repo" >&2
    exit 1
  fi
  CACHE_IMAGE="$CACHE_REGISTRY/${IMAGE_NAME}:buildcache"
fi

# If CACHE_REGISTRY provided, tag runtime image to the same registry
if [[ -n "$CACHE_REGISTRY" ]]; then
  # If IMAGE_NAME isn't already namespaced, prefix it with CACHE_REGISTRY
  if [[ "$IMAGE_NAME" != */* ]]; then
    IMAGE_NAME="$CACHE_REGISTRY/$IMAGE_NAME"
  fi
fi

if ! docker buildx inspect ads-tracker-builder >/dev/null 2>&1; then
  docker buildx create --name ads-tracker-builder --use >/dev/null
else
  docker buildx use ads-tracker-builder >/dev/null
fi

BUILD_ARGS=(
  --target "$TARGET"
  --platform "$PLATFORM"
  --cache-from "type=registry,ref=${CACHE_IMAGE}"
  --cache-to "type=registry,mode=max,ref=${CACHE_IMAGE}"
  -t "${IMAGE_NAME}:latest"
)

if [[ "$PUSH" == "1" ]]; then
  BUILD_ARGS+=(--push)
fi

docker buildx build "${BUILD_ARGS[@]}" .
