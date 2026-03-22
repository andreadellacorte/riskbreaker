# Solo-maintainer defaults: merge options and hygiene without requiring reviews from others.
# After first apply, adjust topics/description here and remove ignore_changes if you want them fully managed.

import {
  to = github_repository.riskbreaker
  id = var.github_repository
}

resource "github_repository" "riskbreaker" {
  name        = var.github_repository
  description = "PSX UX remaster platform — pnpm monorepo (TypeScript, React/Vite, plugins)."

  visibility = "public"

  has_issues   = true
  has_projects = false
  has_wiki     = false

  allow_merge_commit          = true
  allow_squash_merge          = true
  allow_rebase_merge          = true
  allow_auto_merge            = false
  allow_update_branch         = true
  delete_branch_on_merge      = true
  squash_merge_commit_title   = "COMMIT_OR_PR_TITLE"
  squash_merge_commit_message = "COMMIT_MESSAGES"

  vulnerability_alerts = true

  # Avoid clobbering labels/metadata you tune in the UI until you list them here.
  lifecycle {
    ignore_changes = [topics]
  }
}
