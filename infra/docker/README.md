# Docker

Build from the **repository root** (context includes the whole monorepo):

```bash
docker build -f infra/docker/Dockerfile -t riskbreaker:local .
```

We standardize on the **official Nix Docker image** published as **[`docker.io/nixos/nix`](https://hub.docker.com/r/nixos/nix)** (NixOS organization on Docker Hub). Pin the tag via build-arg **`NIX_IMAGE`**; values should stay **`nixos/nix:<tag>`** for consistency.

The build runs **`nix develop`** so Node, pnpm, and other dev-shell packages match `flake.nix`, then `pnpm install`, `pnpm build`, and `pnpm test`.

**Note:** The first `docker build` downloads the dev-shell closure (Nix store paths); expect a large layer. `sandbox = false` is set in the image because Nix’s sandbox is often incompatible with Docker’s default security profile.

**Override Nix image tag:**

```bash
docker build -f infra/docker/Dockerfile --build-arg NIX_IMAGE=docker.io/nixos/nix:2.29.2 -t riskbreaker:local .
```

When `apps/web` is a real Vite app, add a production stage (static assets or a minimal HTTP server) on top of this pattern.
