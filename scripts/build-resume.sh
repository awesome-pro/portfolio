#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEX_FILE="$ROOT_DIR/data/resume.tex"
BUILD_DIR="$ROOT_DIR/.resume-build"
OUTPUT_FILE="$ROOT_DIR/public/resume.pdf"
LATEX_IMAGE="${LATEX_IMAGE:-texlive/texlive:latest}"
DOCKER_BIN="${DOCKER_BIN:-}"

if [[ ! -f "$TEX_FILE" ]]; then
  echo "Missing resume source: $TEX_FILE" >&2
  exit 1
fi

if [[ -z "$DOCKER_BIN" ]]; then
  DOCKER_BIN="$(command -v docker || true)"
fi

if [[ -z "$DOCKER_BIN" ]]; then
  for candidate in /usr/local/bin/docker /opt/homebrew/bin/docker; do
    if [[ -x "$candidate" ]]; then
      DOCKER_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$DOCKER_BIN" ]]; then
  echo "Docker CLI was not found. Install/start Docker, or set DOCKER_BIN=/path/to/docker." >&2
  exit 1
fi

mkdir -p "$BUILD_DIR" "$(dirname "$OUTPUT_FILE")"
rm -rf "$BUILD_DIR"/*
cp "$TEX_FILE" "$BUILD_DIR/resume.tex"

"$DOCKER_BIN" run --rm \
  --volume "$BUILD_DIR:/work" \
  --workdir /work \
  "$LATEX_IMAGE" \
  latexmk -pdf -interaction=nonstopmode -halt-on-error resume.tex

cp "$BUILD_DIR/resume.pdf" "$OUTPUT_FILE"
echo "Generated $OUTPUT_FILE"
