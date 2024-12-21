terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
      version = "2.8.0"
    }
  }
}

resource "vercel_project" "hieudoanm" {
  name      = "hieudoanm"
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = "hieudoanm/hieudoanm.github.io"
  }
}

data "vercel_project_directory" "hieudoanm" {
  path = "."
}

resource "vercel_deployment" "hieudoanm" {
  project_id  = vercel_project.hieudoanm.id
  files       = data.vercel_project_directory.hieudoanm.files
  path_prefix = "."
  production  = true
}

resource "vercel_project_domain" "hieudoanm" {
  project_id = vercel_project.hieudoanm.id
  domain     = "hieudoanm.vercel.app"
}
