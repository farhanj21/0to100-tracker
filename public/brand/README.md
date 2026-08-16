# 0–100 brand assets

Generated from the app icon (`app/icon.svg`) and the header wordmark
(`components/site-header.tsx`). The wordmark is **Instrument Serif**, converted
to outlines — no font is needed to render these.

| File | Use |
| --- | --- |
| `logo-light.svg` / `logo-dark.svg` | Horizontal lockup (mark + wordmark). Default choice. |
| `mark-light.svg` / `mark-dark.svg` | Square mark alone — avatars, favicons, tight spaces. |
| `wordmark-light.svg` / `wordmark-dark.svg` | Type only, no tile. |
| `logo-*.png` (1694×512) | Raster lockup for places that reject SVG. |
| `mark-*.png` (512), `mark-light@1024.png` | Raster mark. |
| `og.png` (1200×630) | Social / Open Graph card. |

`*-light` is for light backgrounds, `*-dark` for dark ones — the difference is
the wordmark colour and a slightly lifted tile so it doesn't sink into the
dark background.

## Colours

Straight from `app/globals.css`:

| Role | Light | Dark |
| --- | --- | --- |
| Accent (`--primary`) | `#1F4BBD` | `#5382EA` |
| Tile | `#14130F` | `#211D17` |
| Track | `#3A3633` | `#4A4137` |
| Wordmark | `#14130F` | `#EEEAE2` |

## Clear space

Keep a margin of at least half the tile height on every side. The SVGs are
cropped tight to the ink, so add that space in the layout.

## Regenerating

The mark is a 2× copy of `app/icon.svg`'s geometry. If that icon changes,
update these too, or the favicon and the logo will drift apart.
