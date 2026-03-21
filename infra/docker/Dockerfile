# syntax=docker/dockerfile:1
# CI image: Docker Hub’s official Nix image (`docker.io/nixos/nix`), then the same toolchain as local `nix develop`.
# https://hub.docker.com/r/nixos/nix — keep `NIX_IMAGE` as a `nixos/nix` tag unless you intentionally fork the base.
ARG NIX_IMAGE=docker.io/nixos/nix:2.29.2
FROM ${NIX_IMAGE}

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
