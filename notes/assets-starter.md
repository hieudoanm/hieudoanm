# Assets Starter

Shared rules for generating starter brand assets (logo, social cards) for
every project under `hieudoanm/`. Agents must follow these specs exactly —
they exist so every repo ships visually consistent assets.

## Table of Contents

- [Assets Starter](#assets-starter)
  - [Table of Contents](#table-of-contents)
  - [Design tokens](#design-tokens)
  - [Logo](#logo)
    - [Canvas](#canvas)
    - [Background \& grid](#background--grid)
    - [Mark](#mark)
    - [Skeleton](#skeleton)
    - [Checklist](#checklist)
  - [Open Graph image](#open-graph-image)
    - [Canvas](#canvas-1)
    - [Background \& grid](#background--grid-1)
    - [Header](#header)
    - [Logo](#logo-1)
    - [Text block](#text-block)
    - [Footer](#footer)
    - [Skeleton](#skeleton-1)
    - [Checklist](#checklist-1)

## Design tokens

Shared values used by every asset. Do not deviate.

| Token      | Value                                 | Used for                   |
| ---------- | ------------------------------------- | -------------------------- |
| Background | `#ffffff` (opaque, never transparent) | canvas fill                |
| Grid       | `#e5e7eb`, `stroke-width="1"`         | grid lines                 |
| Ink        | `#111827`                             | logo strokes, primary text |
| Muted      | `#6b7280`                             | secondary text, URLs       |
| Faint      | `#9ca3af`                             | keywords only              |
| Cell size  | `16 px`                               | grid cells on both assets  |
| Font       | `ui-monospace, Menlo, monospace`      | all OG text                |

## Logo

Every project logo is a single self-contained SVG file: `logo.svg`.

### Canvas

- `viewBox="0 0 512 512"`, `width="512" height="512"` on the root `<svg>`.
- Include `xmlns="http://www.w3.org/2000/svg"`.
- SVG only — no PNG/JPG sources.

### Background & grid

- Opaque near-white background: `<rect width="512" height="512" fill="#ffffff" />`.
- Grid: `32 × 32` cells (32 rows, 32 columns), `16 px` each — lines at every
  multiple of 16 on both axes.
- Grid stroke `#e5e7eb`, `stroke-width="1"`, drawn **behind** the mark
  (earlier in document order).

### Mark

- Centered on the canvas (center point `256, 256`).
- Bounding box: max `384 × 384` px — width **or** height exactly `384` px,
  the other ≤ 384 (keep aspect ratio).
- Safe area: all artwork inside the central `384 × 384` region
  (coordinates `64`–`448` on both axes).
- Stroke-based artwork: `stroke="#111827"`, `stroke-width="16"`,
  `stroke-linecap="round"`, `stroke-linejoin="round"`.
- No fills unless a shape genuinely requires it (e.g. a dot); fills use
  `#111827`.
- Must be legible at `16–32 px` (favicon/nav usage) — prefer bold, simple
  silhouettes over fine detail.

### Skeleton

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#ffffff" />
  <!-- 32x32 grid, 16px cells, behind the mark -->
  <g stroke="#e5e7eb" stroke-width="1">
    <!-- vertical lines at x = 0,16,...,512 -->
    <!-- horizontal lines at y = 0,16,...,512 -->
  </g>
  <!-- mark: centered, <=384px, stroke #111827 width 16 -->
  <g fill="none" stroke="#111827" stroke-width="16"
     stroke-linecap="round" stroke-linejoin="round">
    <!-- paths here -->
  </g>
</svg>
```

Generate grid lines programmatically (loop or copy a precomputed set) —
do not hand-write 64 line elements.

### Checklist

- [ ] `logo.svg`, `viewBox="0 0 512 512"`, opaque near-white background
- [ ] 32×32 light-gray grid visible behind the mark
- [ ] Mark centered, one dimension exactly 384 px, within safe area
- [ ] `stroke-width="16"`, stroke `#111827`, round caps/joins
- [ ] Readable when scaled down to 32 px

## Open Graph image

Every project ships one social share image: `og-image.svg` as source,
exported to `og-image.png` at `1280 × 640` for platforms that require
raster.

### Canvas

- `viewBox="0 0 1280 640"`, `width="1280" height="640"` on the root `<svg>`.
- Include `xmlns="http://www.w3.org/2000/svg"`.

### Background & grid

- Opaque near-white background covering the full canvas.
- Grid: `80 × 40` cells, `16 px` each (1280/80 = 640/40 = 16) — lines at
  every multiple of 16 on both axes.
- Grid stroke `#e5e7eb`, `stroke-width="1"`, drawn behind everything else.

### Header

One row near the top edge, baseline `y=64`.

| Side                                  | Content                                          | Style                                          |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| Left (`x=64`)                         | Project title/name                               | `font-size="32"`, weight `700`, fill `#111827` |
| Right (`x=1216`, `text-anchor="end"`) | Website URL `https://hieudoanm.github.io/<repo>` | `font-size="24"`, fill `#6b7280`               |

### Logo

- Reuse the `logo.svg` mark artwork inside a `<g>`; all mark rules apply
  (stroke `#111827`, `stroke-width="16"`, round caps/joins).
- Bounding box: `256 × 256` px — square marks are exactly `256 × 256`;
  non-square marks keep aspect ratio with one dimension `256`.
- Placement: left side, vertically centered on the canvas midline `y=320`.
  Recommended box: `x=64`, `y=192`, `256 × 256`.
- Scale the artwork's 384 px bounding box (central `[64, 448]` region of
  the 512-unit canvas) down by `256/384 ≈ 0.667`. For the recommended box:
  `transform="translate(64 192) scale(0.6667) translate(-64 -64)"`.

### Text block

One block to the right of the logo (`x=384`), vertically centered on the
canvas midline `y=320`. Max height `384` px; every line is a single line —
truncate with an ellipsis rather than wrap.

| #   | Line        | Content                                                                                                                 | Size | Weight | Fill      |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------- | ---- | ------ | --------- |
| 1   | Tagline     | Short eyebrow/kicker above the title (project category or codename). Uppercase if the project name is short.            | 32   | 400    | `#6b7280` |
| 2   | Title       | Project name.                                                                                                           | 64   | 700    | `#111827` |
| 3   | Description | Tagline/description of the project — smaller than the tagline line.                                                     | 24   | 400    | `#6b7280` |
| 4   | Keywords    | Keywords separated by dots (`·`, U+00B7), e.g. `rust · cli · local-first`. Smaller and more muted than the description. | 20   | 400    | `#9ca3af` |

Reference baselines: `240 / 320 / 376 / 420`. Keep clear visual gaps around
the large title — baseline deltas ≈ `80` (tagline→title), `56`
(title→description), `44` (description→keywords).

### Footer

One row at the bottom edge, baseline `y=592`.

| Side                                  | Content                                              | Style                            |
| ------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| Left                                  | Empty                                                | —                                |
| Right (`x=1216`, `text-anchor="end"`) | Repository URL `https://github.com/hieudoanm/<repo>` | `font-size="24"`, fill `#6b7280` |

Keep the URL on one line; shorten display text if needed but keep the real
URL in the file.

### Skeleton

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 640" width="1280" height="640">
  <rect width="1280" height="640" fill="#ffffff" />
  <!-- 80x40 grid, 16px cells, behind everything -->
  <g stroke="#e5e7eb" stroke-width="1"><!-- grid lines --></g>

  <!-- header: title left, website right -->
  <text x="64" y="64" font-family="ui-monospace, Menlo, monospace"
        font-size="32" font-weight="700" fill="#111827">Project Name</text>
  <text x="1216" y="64" text-anchor="end"
        font-family="ui-monospace, Menlo, monospace"
        font-size="24" fill="#6b7280">hieudoanm.github.io/project</text>

  <!-- logo: 256px box at left, vertically centered -->
  <g transform="translate(64 192) scale(0.6667) translate(-64 -64)">
    <!-- 512-unit logo artwork (same rules as logo.svg) -->
  </g>

  <!-- text block right of logo, centered on y=320, <=384px tall -->
  <text x="384" y="240" font-family="ui-monospace, Menlo, monospace"
        font-size="32" fill="#6b7280">PROJECT CATEGORY</text>
  <text x="384" y="320" font-family="ui-monospace, Menlo, monospace"
        font-size="64" font-weight="700" fill="#111827">Project Name</text>
  <text x="384" y="376" font-family="ui-monospace, Menlo, monospace"
        font-size="24" fill="#6b7280">One-line tagline of the project.</text>
  <text x="384" y="420" font-family="ui-monospace, Menlo, monospace"
        font-size="20" fill="#9ca3af">rust · cli · local-first</text>

  <!-- footer: left empty, repo URL right -->
  <text x="1216" y="592" text-anchor="end"
        font-family="ui-monospace, Menlo, monospace"
        font-size="24" fill="#6b7280">github.com/hieudoanm/project</text>
</svg>
```

### Checklist

- [ ] `og-image.svg` source + `og-image.png` export at `1280 × 640`
- [ ] Opaque near-white background, 80×40 light-gray 16px grid behind all
- [ ] Header: title top-left, website URL top-right (`y=64`)
- [ ] Logo on the left, 256×256, vertically centered on `y=320`
- [ ] Text block right of logo (`x=384`), vertically centered on `y=320`
- [ ] Tagline / title / description / keywords on one line each, in that
      order, block ≤384 px tall
- [ ] Keywords separated by `·` dots, not commas
- [ ] Footer: bottom-left empty, repo URL bottom-right (`y=592`)
- [ ] Text remains legible at typical feed thumbnail sizes
