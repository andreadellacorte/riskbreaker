# Example root module — validates Terraform wiring without cloud credentials.
# Replace with real providers (e.g. aws), backends (S3 + DynamoDB), and modules once hosting is chosen.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

resource "random_id" "placeholder" {
  byte_length = 8
}

output "placeholder_hex" {
  description = "Sanity check output; delete when real infrastructure is modeled."
  value       = random_id.placeholder.hex
}
