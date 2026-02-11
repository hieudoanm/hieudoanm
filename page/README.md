# page

Static landing page listing Hieu Doan's projects. Plain HTML and CSS — no
build step, no JavaScript, no frameworks.

## Structure

| Path                                | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `index.html`                        | The page itself                                           |
| `styles.css`                        | All styles (design tokens in `:root`)                     |
| `images/`                           | App screenshots, `<app>.png` at 1280×640                  |
| `favicon.*`, `apple-touch-icon.png` | Icons (generated from `assets/branding/svg/logo.svg`)     |
| `og.png`                            | OpenGraph image (copy of `assets/branding/images/og.png`) |
| `robots.txt`, `humans.txt`          | Crawler/credit metadata                                   |
| `.well-known/security.txt`          | Security contact (RFC 9116)                               |
| `site.webmanifest`                  | Web app manifest                                          |

## Screenshot pipeline

Images in `images/` are captured from `https://hieudoanm.github.io/<app>/`
with the [`snap`](../scripts/rust/snap/README.md) tool:

```sh
make snap-apps   # captures every app in snap's APPS list -> page/images/
```

When adding a project, add its card to `index.html`, add the app name to
`APPS` in `scripts/rust/snap/src/main.rs`, and re-run `make snap-apps`.

## Design rules

Follow [`notes/ai-unslop-design.md`](../notes/ai-unslop-design.md): real
product screenshots, one accent colour, consistent spacing/radius, no
filler badges or decorative emoji.

## Local preview

```sh
python3 -m http.server 8000   # from the repo root
open http://localhost:8000/page/
```

The page uses relative paths (`styles.css`, `images/…`) so it works over
`file://` and when deployed to GitHub Pages (see
[`.github/workflows/ci.yaml`](../.github/workflows/ci.yaml), which uploads
`page/` as the Pages artifact).
