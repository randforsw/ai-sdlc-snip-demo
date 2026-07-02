# Snip Design Language
> Inspired by Lovable.dev — dark, minimal, warm gradient hero

## Colour Tokens

| CSS var | Value | Purpose |
|---|---|---|
| `--bg` | `#09090d` | Page background (near-black) |
| `--surface` | `#111118` | Card / input surface |
| `--surface-2` | `#1a1a24` | Table header, secondary surfaces |
| `--border` | `rgba(255,255,255,0.07)` | Subtle card outlines |
| `--border-mid` | `rgba(255,255,255,0.12)` | Input border, dividers |
| `--text` | `#f0f0f5` | Primary text |
| `--muted` | `#6b6b80` | Placeholder, de-emphasised labels |
| `--muted-2` | `#9898a8` | Secondary data, small labels |
| `--accent-a` | `#ff6b6b` | Gradient start — coral |
| `--accent-b` | `#ff4d8d` | Gradient mid — hot pink |
| `--accent-c` | `#c84dff` | Gradient end — soft violet |

## Accent Gradient
```css
--gradient: linear-gradient(135deg, #ff6b6b 0%, #ff4d8d 50%, #c84dff 100%);
```
Used for: hero `<h1>` text-fill, primary button background.

## Hero Glow
```css
background: radial-gradient(ellipse 80% 55% at 50% -5%,
              rgba(255,77,141,0.18) 0%, transparent 65%);
```
Applied to the `.hero` wrapper; produces the warm ambient light above the fold.

## Typography

| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero h1 | `clamp(2.5rem, 6vw, 4.5rem)` | 800 | `-0.03em` letter-spacing; gradient clip fill |
| Hero sub | `1.0625rem` | 400 | `--muted-2` colour |
| Card label | `0.8125rem` | 600 | uppercase, `0.05em` tracking, `--muted` |
| Body | `1rem` | 400 | line-height 1.6 |
| Code | monospace stack | 600 | `--font-mono` |

**Font stacks**
```
--font:      'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace
```

## Spacing
- Container: `max-width 760px`, centred, `padding 0 1.25rem`
- Hero: `padding-top 5rem`
- Gap between sections: `2.5rem`

## Border Radii

| Token | Value | Used for |
|---|---|---|
| `--radius-pill` | `9999px` | URL input, CTA button, notice badges |
| `--radius-card` | `18px` | All cards / section containers |
| `--radius-sm` | `10px` | Inline notice banners |

## Shadows & Glow
```css
--shadow-card: 0 1px 0 0 var(--border), 0 4px 24px rgba(0,0,0,0.5);
--shadow-glow: 0 0 60px rgba(255,77,141,0.08);
--ring-focus:  0 0 0 3px rgba(255,77,141,0.2);
```

## Element Mapping

| Snip element | Design role | Key classes |
|---|---|---|
| `<h1>Snip</h1>` | Hero headline | `.hero h1` — gradient text, oversized, centred |
| Subline | Short muted sentence below h1 | `.hero-sub` |
| URL form | Chat-style pill input | `.pill-form` / `.pill-input` / `.pill-btn` |
| Error message | Inline banner, red-tinted | `.notice.notice--error` |
| Success result | Inline banner, green-tinted | `.notice.notice--success` |
| Links section | Dark rounded card | `.links-card` |
| Table header | Secondary surface (`--surface-2`) | small uppercase `<th>` |
| Short-code cell | Monospace accent link | `.code-cell a` |
