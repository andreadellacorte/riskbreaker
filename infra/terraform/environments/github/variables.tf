variable "github_owner" {
  type        = string
  description = "GitHub user or organization that owns the repository."
  default     = "andreadellacorte"
}

variable "github_repository" {
  type        = string
  description = "Repository name (without owner)."
  default     = "riskbreaker"
}

variable "github_token" {
  type        = string
  description = "GitHub personal access token with repo scope (fine-grained: Contents + Administration read/write as needed). Set via TF_VAR_github_token or terraform.tfvars (not committed)."
  sensitive   = true
}
