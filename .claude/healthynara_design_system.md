# DESIGN.md — Healthy Nara Dashboard Design System

> Copy this file into the root of your Claude Code project. The agent will use it as the
> authoritative style contract for every component it generates or edits.

---

## 1. Brand

| Token | Value |
|---|---|
| Product name | Healthy Nara |
| Tagline | Care platform |
| Logo mark | Teal square `rounded-xl`, white bold `HN` initials |
| Primary brand color | `#14B8A6` (Teal 500) |
| Secondary brand color | `#38BDF8` (Sky 400) |

---

## 2. Color Palette

### Semantic tokens (CSS variables via Tailwind `@theme`)

```css
--color-background:        #F9FAFB;   /* Page background */
--color-foreground:        #0F172A;   /* Default text */

--color-card:              #FFFFFF;   /* Card / panel surface */
--color-card-foreground:   #0F172A;

--color-primary:           #14B8A6;   /* Teal — CTAs, active states */
--color-primary-foreground:#FFFFFF;

--color-secondary:         #38BDF8;   /* Sky blue — charts, accents */
--color-secondary-foreground: #FFFFFF;

--color-muted:             #F1F5F9;   /* Subtle fills, row hover */
--color-muted-foreground:  #64748B;   /* Secondary text */

--color-accent:            #14B8A6;
--color-accent-foreground: #FFFFFF;

--color-destructive:       #EF4444;   /* Errors, danger */
--color-destructive-foreground: #F8FAFC;

--color-border:            #E2E8F0;   /* Borders, dividers */
--color-input:             #E2E8F0;
--color-ring:              #14B8A6;   /* Focus rings */
```

### Raw palette reference

| Role | Tailwind class | Hex |
|---|---|---|
| Primary / Active | `bg-teal-500` | `#14B8A6` |
| Primary Light | `bg-teal-50` | `#F0