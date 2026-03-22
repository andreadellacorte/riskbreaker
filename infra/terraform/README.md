# Terraform

This directory holds **infrastructure as code**. The [`environments/github`](./environments/github/) root module manages **this GitHub repository’s** settings via the [`integrations/github`](https://registry.terraform.io/providers/integrations/github/latest/docs) provider (solo-friendly: no required reviews from others). **Netlify / AWS** remain separate; add modules and another root module when you wire those providers.

## Layout

| Path                                               | Purpose                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`environments/github/`](./environments/github/) | **GitHub** `github_repository` for `andreadellacorte/riskbreaker` (imported via `import` block, not recreated). |
| `modules/`                                         | Reserved for shared modules (e.g. VPC, ECS) once hosting topology is chosen.                             |

## Local usage

From the environment directory:

```bash
cd infra/terraform/environments/github
cp terraform.tfvars.example terraform.tfvars   # add github_token; file is gitignored
# or: export TF_VAR_github_token="$(gh auth token)"
terraform init
terraform plan
terraform apply   # when you want GitHub settings to match this repo
```

**Token:** A **classic** PAT with `repo` scope, or a **fine-grained** PAT with **Repository administration** and **Contents** (read/write) for this repository, is enough for repository settings. Do not commit tokens.

**State:** By default Terraform keeps state locally (`terraform.tfstate` is gitignored). **GitHub Actions `terraform apply` on `main`** uses an ephemeral workspace: without a **remote backend** in `versions.tf`, each run starts with empty state and may try to re-import or drift. Configure a remote backend (S3 + DynamoDB lock, Terraform Cloud, etc.) before relying on CI apply, or run **`terraform apply` locally** where state persists.

## CI

GitHub Actions runs `terraform fmt -check`, `init`, `validate`, **`plan`**, and on **pushes to `main` only** **`apply -auto-approve`** (updates GitHub repo settings from this module). Plan/apply use the **`TERRAFORM_GITHUB_TOKEN`** repository secret. Fork PRs skip plan/apply (secrets are unavailable). See **State** above for remote backend expectations on CI apply.

## Hosting (future)

**Netlify** serves static **`apps/web`** ([`netlify.toml`](../../netlify.toml)). Add other providers and environments under `infra/terraform/` only if you need non-static cloud resources; keep GitHub and cloud in separate state if you prefer a smaller blast radius.

## Formatting

```bash
terraform fmt -recursive infra/terraform
```
