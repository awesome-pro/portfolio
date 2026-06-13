#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/.resume-build"
LATEX_IMAGE="${LATEX_IMAGE:-texlive/texlive:latest}"
DOCKER_BIN="${DOCKER_BIN:-}"
ALL_VARIANTS=(resume ml_resume forward_deployed_resume)

usage() {
  cat >&2 <<'EOF'
Usage: scripts/build-resume.sh [resume|ml_resume|forward_deployed_resume|all]...

When no variant is provided, all resume PDFs are built.
EOF
}

tex_file_for() {
  case "$1" in
    resume) echo "$ROOT_DIR/data/resume.tex" ;;
    ml_resume) echo "$ROOT_DIR/data/ml_resume.tex" ;;
    forward_deployed_resume) echo "$ROOT_DIR/data/forward_deployed_resume.tex" ;;
    *)
      echo "Unknown resume variant: $1" >&2
      usage
      exit 1
      ;;
  esac
}

output_file_for() {
  case "$1" in
    resume) echo "$ROOT_DIR/public/resume.pdf" ;;
    ml_resume) echo "$ROOT_DIR/public/ml_resume.pdf" ;;
    forward_deployed_resume) echo "$ROOT_DIR/public/forward_deployed_resume.pdf" ;;
    *)
      echo "Unknown resume variant: $1" >&2
      usage
      exit 1
      ;;
  esac
}

if [[ "$#" -eq 0 ]]; then
  VARIANTS=("${ALL_VARIANTS[@]}")
else
  VARIANTS=()
  for variant in "$@"; do
    if [[ "$variant" == "all" ]]; then
      VARIANTS=("${ALL_VARIANTS[@]}")
      break
    fi

    case "$variant" in
      resume|ml_resume|forward_deployed_resume) VARIANTS+=("$variant") ;;
      *)
        echo "Unknown resume variant: $variant" >&2
        usage
        exit 1
        ;;
    esac
  done
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

mkdir -p "$BUILD_DIR" "$ROOT_DIR/public"

for variant in "${VARIANTS[@]}"; do
  TEX_FILE="$(tex_file_for "$variant")"
  OUTPUT_FILE="$(output_file_for "$variant")"
  VARIANT_BUILD_DIR="$BUILD_DIR/$variant"

  if [[ ! -f "$TEX_FILE" ]]; then
    echo "Missing resume source: $TEX_FILE" >&2
    exit 1
  fi

  rm -rf "$VARIANT_BUILD_DIR"
  mkdir -p "$VARIANT_BUILD_DIR"
  cp "$TEX_FILE" "$VARIANT_BUILD_DIR/resume.tex"

  "$DOCKER_BIN" run --rm \
    --volume "$VARIANT_BUILD_DIR:/work" \
    --workdir /work \
    "$LATEX_IMAGE" \
    latexmk -pdf -interaction=nonstopmode -halt-on-error resume.tex

  cp "$VARIANT_BUILD_DIR/resume.pdf" "$OUTPUT_FILE"
  echo "Generated $OUTPUT_FILE"
done
