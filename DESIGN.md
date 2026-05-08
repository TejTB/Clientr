# CLIENTR — Design System

## Color (OKLCH-tinted dark)

| Token | Value | Use |
|---|---|---|
| `bg` | `#0A0A0A` | Page background |
| `surface` | `#111111` | Cards, table headers, modals |
| `surface-2` | `#1a1a1a` | Hover, nested surfaces, code blocks |
| `border` | `rgba(255,255,255,0.06)` | Default dividers |
| `border-strong` | `rgba(255,255,255,0.12)` | Active inputs, focus rings |
| `accent` | `#00FF87` | Primary CTA, brand wordmark, won status |
| `text` | `#F2F2F2` | Primary copy |
| `muted` | `rgba(255,255,255,0.45)` | Secondary copy, table labels |
| `danger` | `#FF3B3B` | Lost status, destructive actions |
| `warning` | `#FFB800` | Followed-up status |
| `info` | `#00D4FF` | Replied status |

**Color strategy:** Restrained. Tinted-dark neutrals + one accent (#00FF87) used ≤5 times per page. Status colours are reserved for status pills only — never decorative.

## Typography
System stack only — no Inter, no Geist, no web fonts.
`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif`

| Step | Size / weight | Use |
|---|---|---|
| Display | 32px / 600 | Page titles, search hero |
| H1 | 22px / 600 | Section headers |
| Body | 14px / 400 | Default |
| Small | 13px / 400 | Table cells secondary |
| Micro | 11px / 500 / uppercase / tracking 0.08em | Table headers, labels |

Body line length capped at 70ch.

## Layout
- 8px grid. Default spacing 16/24/32.
- Container max width 1280px on dashboard, 880px on search.
- Tables full-bleed inside container — no card wrapping a table.
- Cards: 12px radius, 1px border, no nested cards.

## Motion
- All easing: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart).
- Durations: 160ms (hover), 240ms (panel/page), 360ms (loading text cycle).
- Never animate layout properties (width/height/top). Use transform + opacity.
- Slide-over: translateX from 100% to 0.

## Components
- **Button primary:** bg `accent`, text black, weight 600, radius `9999px`, padding `10px 18px`. Hover: subtle accent shadow.
- **Button secondary:** bg `surface`, text `text`, border `border-strong`, radius 8px.
- **Input/textarea:** bg `surface`, border `border`, focus border `border-strong`, no default ring.
- **Pill (status):** radius `9999px`, padding `4px 10px`, font-size 12px, weight 500.
- **Stat pill:** radius `9999px`, padding `8px 16px`, bg `surface`, border `border`.

## Anti-patterns (banned)
- Side-stripe coloured borders on cards / list items.
- Gradient text (`background-clip: text`).
- Glassmorphism / backdrop-blur as default.
- Identical card grids of icon + heading + text.
- Modals as a first reach (use slide-over panel or inline expand).
- Em dashes in copy. Use commas, colons, periods, parens.
