# Docusaurus

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Table of Content

- [Docusaurus](#docusaurus)
  - [Table of Content](#table-of-content)
  - [Installation](#installation)
  - [Local Development](#local-development)
  - [Build](#build)
  - [Deployment](#deployment)

## Installation

```sh
$ yarn

// output
```

## Local Development

```sh
$ yarn start

// output
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```sh
$ yarn build

// output
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```sh
$ USE_SSH=true yarn deploy

// output
```

Not using SSH:

```sh
$ GIT_USER=<Your GitHub username> yarn deploy

// output
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
