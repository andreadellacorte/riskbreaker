{
  description = "Riskbreaker — reproducible dev shell (Node, pnpm, infra CLIs)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          # Terraform uses Hashicorp BSL (unfree in nixpkgs); required by project-spec infra tooling.
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "riskbreaker";

          packages = with pkgs; [
            nodejs_24
            corepack
            git
            docker-compose
            kubectl
            terraform
            # Netlify CLI (nixpkgs); use for `netlify deploy` / `netlify login` — not a pnpm dependency.
            netlify-cli
          ];

          # Pin pnpm to match root `packageManager`. Avoid `corepack enable` here: it tries to write
          # under the read-only Nix store and fails with EACCES.
          shellHook = ''
            corepack prepare pnpm@10.32.1 --activate
            echo "Riskbreaker dev shell (Nix): node $(node --version), pnpm $(pnpm --version)"
            echo "Docker: use Docker Desktop / Colima on macOS, or your distro's docker; compose CLI is on PATH here."
            echo "Playwright: run \`pnpm exec playwright install chromium\` (or \`--with-deps\` on Linux) before \`pnpm e2e\`; CI mirrors this in GitHub Actions."
            echo "Netlify CLI: \`netlify --version\` (from nixpkgs netlify-cli)."
          '';
        };
      }
    );
}
