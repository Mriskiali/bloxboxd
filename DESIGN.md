# DESIGN.md — Bloxboxd

Direction for every UI change. Read before touching a component.
Filter: antislop (core + `antislop-ui`). This file is the *direction*; antislop is the *filter*.

## What this product is

A social diary for Roblox experiences. You log what you played, rate it, review it,
and follow people whose taste you trust. It is not a store, not a launcher, not a
dashboard. It is a **catalogue with opinions**.

Reference: Letterboxd. Not to clone, but to inherit its discipline:
dense poster grid, dark cinematic ground, tiny uppercase metadata, serif for
editorial voice, one green action per surface, zero decoration that isn't data.

## Personality

Obsessive, quiet, confident. A person who has opinions about which obby is
actually good and will tell you in 90 words. Not a hype machine, not a
"gamer" brand with neon and flames. The interface should feel like a
well-kept notebook, not a storefront.

Dials (antislop R-37): **ENERGY 2 / RHYTHM 3 / MOTION 2**
- Energy 2: restrained. Colour appears only where it carries meaning.
- Rhythm 3: sections differ in density and scale; the grid is not uniform wallpaper.
- Motion 2: hover states and one page transition. No looping animation, no parallax.

## Palette

Dark ground is justified: the product is image-first (game art), and Letterboxd's
own dark ground is the reference. Not "dark because tech".

| Token | Hex | Role |
|---|---|---|
| `--bb-bg` | `#14181c` | page ground (Letterboxd's exact ground) |
| `--bb-panel` | `#1b2228` | raised surface: cards, inputs, modals |
| `--bb-panel-2` | `#232c34` | hover / selected surface |
| `--bb-line` | `#2c3440` | 1px borders, dividers (never a shadow) |
| `--bb-line-soft` | `#20282f` | internal dividers |
| `--bb-text` | `#dbe4ee` | primary text |
| `--bb-muted` | `#8fa3b3` | secondary text, metadata |
| `--bb-faint` | `#61707d` | tertiary: timestamps, counts |
| `--bb-green` | `#00e054` | the one action colour: log, save, primary CTA |
| `--bb-orange` | `#ff8000` | ratings, favourites, stars |
| `--bb-blue` | `#40bcf4` | links, secondary emphasis |

Rules:
- Green appears **once per surface** (the primary action). Never as decoration,
  never as a border, never as a glow.
- Orange is reserved for rating stars and the favourite heart. Nothing else.
- Blue is for inline links only.
- No gradients. No glow. No coloured shadows.

## Typography

| Role | Face | Size / weight |
|---|---|---|
| Editorial headings (page titles, hero, review quotes) | **Newsreader** (variable serif) | 32–56px, 500–600, tight leading (0.95–1.05) |
| UI text, body, buttons | **Hanken Grotesk** (variable sans) | 13–16px, 400–600 |
| Micro-labels (section heads, metadata, tabs) | Hanken Grotesk, uppercase | 11px, 600, tracking 0.09em, colour `--bb-faint` |

Numbers (counts, ratings) use `font-variant-numeric: tabular-nums`.
Never centre long body text. Never letterspace lowercase body.

## Layout

- Max content width 1180px, 24px gutters. Poster grid breaks out wider (1280px).
- Poster grid: 6 columns ≥1200px, 5 ≥1000, 4 ≥760, 3 ≥520, 2 below.
  Gap 12px. Poster aspect 2:3 (Roblox icon art is square — cards use a 2:3
  frame with the icon inset, so the grid stays film-like).
- Section rhythm: 48–64px between sections, 16–24px inside a section.
  Vary it: the hero is dense, the grid is airy, the footer is tight.
- Page headers are left-aligned, serif, with a hairline rule under them.

## Surfaces & depth

- Radius: **3px** on cards/inputs, **2px** on buttons, 999px only for avatars.
- Borders carry structure. Shadows exist only on modals/dropdowns (one elevation).
- No glassmorphism. No backdrop blur except the mobile nav sheet.
- Hover = border lightens + surface shifts one step. No scale-up on cards
  (that is a storefront tell); instead the poster brightens and actions appear.

## Components

- **Navbar**: 48px tall, flat `--bb-bg`, 1px bottom rule. Wordmark in serif.
  Nav links 13px muted, active = white + 2px green underline sitting on the rule.
  Search collapses to an icon; the input is a 1px-bordered field, not a pill.
- **GameCard**: poster frame, title 13px semibold 2-line clamp, meta line 11px
  muted (year · genre · rating). Rating shown as `★ 4.4` in orange, no pill.
  Hover: 1px green border on the frame + quick-action bar at the bottom of the
  poster (Log / ♥ / +).
- **Buttons**: 28–32px tall, 2px radius, 12px 600. Primary = green bg, ink text.
  Secondary = 1px border, transparent bg, text colour. Ghost = text only.
- **Inputs**: 1px border `--bb-line`, panel bg, 3px radius, 14px text.
  Focus = green border, no glow ring.
- **Ratings**: stars 12px, orange, half-star via clip. Never a pill badge.
- **Avatars**: circle, 1px border, no ring glow.
- **Empty states**: one line of serif copy + one action. No illustration.

## Copy

Sentence case. No exclamation marks. No "Oops!", no "Let's", no emoji in UI
chrome (game names keep theirs). Numbers are real: "1,204 logs" not "lots of logs".
Indonesian UI copy stays Indonesian; keep it dry and specific.

## Banned (antislop + local)

Gradients, glow, glass, pill-everything, `rounded-2xl` on cards, purple/indigo,
blue-purple hero, emoji section headers, "✨", "🚀", uniform 3-card feature rows,
centred hero with two CTAs, drop shadows on every card, hover scale 1.05,
`backdrop-blur` on more than the mobile sheet, skeleton shimmer in brand colours.
