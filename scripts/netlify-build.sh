#!/usr/bin/env bash
# Netlify (and CI parity): no system Nix — use [nix-portable](https://github.com/DavHau/nix-portable)
# so `ensure:pcsx-wasm` can run `nix-shell -p emscripten gnumake`.
#
# POC pattern: [justinas/nix-netlify-poc](https://github.com/justinas/nix-netlify-poc/blob/master/build.sh)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Release binaries are Linux ELFs only (see DavHau/nix-portable). Netlify + GHA ubuntu-latest match.
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "scripts/netlify-build.sh: Linux only (Netlify / CI). On macOS use: nix develop --command bash -c 'pnpm install --frozen-lockfile && pnpm --filter @riskbreaker/web build'" >&2
  exit 1
fi

NP_VER="${NIX_PORTABLE_VERSION:-v012}"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) NP_ASSET="nix-portable-x86_64" ;;
  aarch64) NP_ASSET="nix-portable-aarch64" ;;
  *)
    echo "nixPortable: unsupported Linux uname -m=$ARCH (expected x86_64 or aarch64)" >&2
    exit 1
    ;;
esac

# Persist between Netlify builds when cache is enabled (optional).
CACHE_ROOT="${NETLIFY_CACHE_DIR:-$ROOT/.cache}"
NP_DIR="$CACHE_ROOT/nix-portable"
mkdir -p "$NP_DIR"
NP_BIN="$NP_DIR/nix-portable-${NP_VER}-${NP_ASSET}"

if [[ ! -x "$NP_BIN" ]]; then
  echo "Downloading nix-portable ${NP_VER} (${NP_ASSET})…"
  curl -fsSL "https://github.com/DavHau/nix-portable/releases/download/${NP_VER}/${NP_ASSET}" -o "$NP_BIN.$$"
  chmod +x "$NP_BIN.$$"
  mv "$NP_BIN.$$" "$NP_BIN"
fi

export NIX_PORTABLE="$NP_BIN"

pnpm install --frozen-lockfile
pnpm --filter @riskbreaker/web build
