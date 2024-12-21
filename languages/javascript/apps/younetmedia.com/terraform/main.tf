terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
      version = "2.8.0"
    }
  }
}

resource "vercel_project" "younetmedia" {
  name      = "younetmedia"
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = "hieudoanm/hieudoanm"
  }
}

data "vercel_project_directory" "younetmedia" {
  path = "projects/younetmedia"
}

resource "vercel_deployment" "younetmedia" {
  project_id  = vercel_project.younetmedia.id
  files       = data.vercel_project_directory.younetmedia.files
  path_prefix = "projects/younetmedia"
  production  = true
}

resource "vercel_project_domain" "younetmedia" {
  project_id = vercel_project.younetmedia.id
  domain     = "younetmedia.vercel.app"
}
