# syntax=docker/dockerfile:1
# Multi-stage:
#   - `ci` — Nix dev shell + pnpm build/test (use for CI and local parity).
#   - `web` — static `apps/web` dist behind nginx (default build target).
# https://hub.docker.com/r/nixos/nix — keep `NIX_IMAGE` as a `nixos/nix` tag unless you intentionally fork the base.
ARG NIX_IMAGE=docker.io/nixos/nix:2.29.2
FROM ${NIX_IMAGE} AS ci

# Flakes + relax sandbox (typical inside Docker; builders often lack nested namespace support).
RUN mkdir -p /etc/nix && \
    printf "%s\n" \
      "experimental-features = nix-command flakes" \
      "sandbox = false" \
      >> /etc/nix/nix.conf

WORKDIR /app

COPY flake.nix flake.lock ./
COPY . .

RUN nix develop --accept-flake-config --command bash -lc \
  'pnpm install --frozen-lockfile && pnpm build && pnpm test'

ENTRYPOINT ["nix", "develop", "--accept-flake-config", "--command"]
CMD ["pnpm", "test"]

# --- Static web (apps/web) — default `docker build` target
FROM nginx:1.27-alpine AS web
COPY --from=ci /app/apps/web/dist /usr/share/nginx/html
COPY infra/docker/nginx.web.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
