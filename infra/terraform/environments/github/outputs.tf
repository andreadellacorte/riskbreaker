output "repository_html_url" {
  description = "HTTPS URL of the GitHub repository."
  value       = github_repository.riskbreaker.html_url
}

output "repository_name" {
  description = "Repository name."
  value       = github_repository.riskbreaker.name
}
