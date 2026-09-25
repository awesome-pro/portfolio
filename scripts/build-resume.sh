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

# These resumes are typeset with pdflatex, which only copes with the Unicode
# characters LaTeX happens to have a text definition for. Symbols like →, ↔ or ≤
# abort the run with "Unicode character ... not set up for use with LaTeX", and
# because latexmk stops at the first one, every CI run reveals exactly one more
# character. Checking up front lists all of them at once.
check_ascii() {
  local tex_file="$1"
  local offenders

  offenders="$(LC_ALL=C grep -n '[^[:print:][:space:]]' "$tex_file" || true)"
  if [[ -z "$offenders" ]]; then
    return 0
  fi

  echo "ERROR: $tex_file contains characters pdflatex cannot typeset:" >&2
  printf '%s\n' "$offenders" >&2
  cat >&2 <<'EOF'

Use the ASCII/LaTeX spelling the resumes already use:
  ->   $\rightarrow$      <->  $\leftrightarrow$    <=  $\leq$
  x    $\times$           ~    $\sim$ (before a number, never a bare ~)
  '    '                  -    -- (en dash), --- (em dash), \% for percent
EOF
  return 1
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

# Validate every requested source before touching Docker or building anything.
for variant in "${VARIANTS[@]}"; do
  tex_file="$(tex_file_for "$variant")"
  if [[ -f "$tex_file" ]]; then
    check_ascii "$tex_file" || exit 1
  fi
done

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
