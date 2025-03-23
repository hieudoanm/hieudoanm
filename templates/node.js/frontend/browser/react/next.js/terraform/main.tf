terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
      version = "2.15.1"
    }
  }
}

resource "vercel_project" "js16" {
  name      = "js16"
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = "hieudoanm/hieudoanm.github.io"
  }
}

data "vercel_project_directory" "js16" {
  path = "."
}

resource "vercel_deployment" "js16" {
  project_id  = vercel_project.js16.id
  files       = data.vercel_project_directory.js16.files
  path_prefix = "."
  production  = true
}

resource "vercel_project_domain" "js16" {
  project_id = vercel_project.js16.id
  domain     = "js16.vercel.app"
}
