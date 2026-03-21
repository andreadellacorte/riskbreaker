# Terraform (scaffold)

This directory holds **IaC scaffolding**. It does **not** provision real cloud resources until hosting is confirmed with the project owner (see **Hosting** below).

## Layout

| Path                                               | Purpose                                                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`environments/example/`](./environments/example/) | Minimal root module using the **`random`** provider only — enough for `terraform fmt` / `validate` in CI without cloud credentials. |
| `modules/`                                         | Reserved for shared modules (e.g. ECS, VPC) once a provider and topology are chosen.                                                |

Replace or extend `environments/example` when you add AWS (or another provider) backends and modules.

## Hosting

**Intent (from product docs):** something like **AWS ECS** is plausible; **simpler** stacks (static site + CDN, etc.) remain valid.

**Status:** **Owner decision pending** — do not `terraform apply` to a real account until the owner picks a target and backend (state bucket, locks, regions). The example environment exists to keep the toolchain honest, not to lock ECS vs alternatives.

## Commands

From the repo root (or `cd` into the environment):

```bash
cd infra/terraform/environments/example
terraform init
terraform validate
terraform plan   # no-op for random_id; still exercises graph
```

Formatting:

```bash
terraform fmt -recursive infra/terraform
```

CI runs `terraform fmt -check` and `validate` on the example environment.
