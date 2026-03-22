# Terraform

This directory holds **infrastructure as code**. The [`environments/example`](./environments/example/) root module manages **this GitHub repository’s** settings via the [`integrations/github`](https://registry.terraform.io/providers/integrations/github/latest/docs) provider (solo-friendly: no required reviews from others). **Netlify / AWS** remain separate; add modules and another root module when you wire those providers.

## Layout

| Path                                               | Purpose                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`environments/example/`](./environments/example/) | **GitHub** `github_repository` for `andreadellacorte/riskbreaker` (imported via `import` block, not recreated). |
| `modules/`                                         | Reserved for shared modules (e.g. VPC, ECS) once hosting topology is chosen.                             |

## Local usage

From the environment directory:

```bash
cd infra/terraform/environments/example
cp terraform.tfvars.example terraform.tfvars   # add github_token; file is gitignored
# or: export TF_VAR_github_token="$(gh auth token)"
terraform init
terraform plan
terraform apply   # when you want GitHub settings to match this repo
```

**Token:** A **classic** PAT with `repo` scope, or a **fine-grained** PAT with **Repository administration** and **Contents** (read/write) for this repository, is enough for repository settings. Do not commit tokens.

**State:** By default Terraform keeps state locally (`terraform.tfstate` is gitignored). For shared or CI **`apply`**, configure a **remote backend** (e.g. S3 + lock) or Terraform Cloud.

## CI

GitHub Actions runs `terraform fmt -check`, `init`, `validate`, and **`plan`** (drift vs this config) on **pushes** and **non-fork pull requests**. The plan step uses the **`TERRAFORM_GITHUB_TOKEN`** repository secret. Fork PRs skip the plan step (secrets are unavailable).

## Hosting (future)

**Intent (from product docs):** something like **AWS ECS** is plausible; **Netlify** already serves static `apps/web` via [`netlify.toml`](../../netlify.toml).

Add provider blocks and environments under `infra/terraform/` when you model cloud resources; keep GitHub and cloud in separate state if you prefer smaller blast radius.

## Formatting

```bash
terraform fmt -recursive infra/terraform
```
