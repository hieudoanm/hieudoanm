# assets

Static assets for the profile README and the `page/` landing site.

## Contents

| Path                                               | Purpose                                                        |
| -------------------------------------------------- | -------------------------------------------------------------- |
| [`branding/`](branding/)                           | Images and vectors used in the GitHub profile README           |
| `branding/svg/`                                    | Source SVGs (`logo.svg`, `og.svg` for the OpenGraph card)      |
| `branding/images/`                                 | Raster exports (`logo.png`, `og.png`)                          |
| [`branding/svg-to-png.sh`](branding/svg-to-png.sh) | Converts every SVG under a directory to PNG via `rsvg-convert` |

## Regenerating branding PNGs

```sh
brew install librsvg   # provides rsvg-convert
./assets/branding/svg-to-png.sh assets/branding
```

## App screenshots

Screenshots of the projects listed in the README are **not** stored here.
They live in [`page/images/landing/`](../page/images/landing/) next to the landing page and
are captured with the [`snap`](../scripts/rust/snap/README.md) tool:

```sh
make snap-apps     # writes page/images/landing/<app>.png for each README app link
make snap-readmes  # writes page/images/readme/<app>.png (full page)
```
