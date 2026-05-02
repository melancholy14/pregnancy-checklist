# Design System — pregnancy-checklist

> An editorial, mobile-first design system for a Korean pregnancy & parenting product.
> Read this file before writing UI. Reference the tokens defined in [src/app/globals.css](src/app/globals.css);
> never inline raw hex values that aren't already in the token set.

---

## 1. Overview

This product is a Korean-language pregnancy & parenting companion. The interface is a
**warm cream canvas with multi-pastel accents and editorial reading surfaces** — closer to
a soft-print magazine than a SaaS dashboard. Three forces define the look:

1. **Warm canvas, not white.** The page floor is `#FFFAF7` — a tinted cream. Pure white
   reads cold and clinical; the warm tint signals care. Cards sit on top in pure white
   so they read as physical paper laid on a beige desk.
2. **Five-pastel governance.** A small, fixed palette of soft pastels (pink, lavender,
   mint, peach, yellow) carries semantic roles. Each pastel has one job. Don't mix roles
   or invent a sixth pastel.
3. **Editorial reading.** Long-form articles are first-class. The `.article-prose` system
   in [globals.css](src/app/globals.css) defines a complete reading surface with custom
   list bullets, blockquote styling, table chrome, and link treatment. Article pages
   inherit this system; never override its rules ad-hoc.

The brand voltage comes from the **cream + soft-pink + warm-purple trio**: pink for the
primary CTA, lavender for secondary surfaces, and the muted purple `#6B5A80` for
emphasized links and editorial accents. Mint, peach, and yellow are functional
(success / data / info) — they appear, but not in chrome.

**Key Characteristics:**
- Cream canvas (`#FFFAF7`) with white cards. No dark surfaces in the marketing or
  product chrome — dark-mode tokens exist but aren't a brand surface.
- Pretendard Variable as the entire type stack. Korean-first; `word-break: keep-all`
  is mandatory in long-form prose.
- Whisper-weight borders: `rgba(0, 0, 0, 0.05)`. Borders are felt, not seen.
- Five-stop shadow scale (`shadow-sm` … `shadow-xl`) tuned for soft elevation;
  individual shadow opacities never exceed 0.07.
- A single corner-radius spine: `--radius: 0.875rem` (14px). Buttons run smaller, hero
  cards run larger, but the rhythm is set by 14px.
- Mobile-first. The default page is single-column with `pb-24` to clear the
  fixed `BottomNav`. There is no enforced `max-w-*` container — the page breathes
  with `px-4` margins on phones.

---

## 2. Color

### 2.1 Canvas & Text

| Role | Token | Hex | Use |
|---|---|---|---|
| Page canvas | `--background` / `bg-background` | `#FFFAF7` | The page floor. Default body background. Warm cream, never white. |
| Card surface | `--card` / `bg-card` | `#FFFFFF` | Pure white card / sheet on top of canvas. The card's whiteness against the cream canvas IS the elevation cue — shadows reinforce, they don't define. |
| Muted surface | `--muted` / `bg-muted` | `#F8F6F4` | Tertiary surfaces: input wells, secondary tabs, subtle alt sections. |
| Input well | `--input-background` | `#FFFBF8` | Form input field background. Slightly warmer than card to differentiate from sheet content. |
| Primary text | `--foreground` / `text-foreground` | `#3D4447` | All headings and primary body text. Warm dark gray, never pure black. |
| Muted text | `--muted-foreground` / `text-muted-foreground` | `#9CA0A4` | Captions, metadata, disabled states, placeholder text. |
| Border | `--border` / `border-border` | `rgba(0, 0, 0, 0.05)` | Whisper border for cards, dividers, sub-nav. Use `border-black/4` or `border-black/5` Tailwind shorthand inline; both resolve to the same near-imperceptible weight. |

### 2.2 Pastel Palette — Five Roles

Each pastel carries exactly one semantic job. Memorize the role; do not cross-assign.

| Pastel | Token | Hex | Role | Where it appears |
|---|---|---|---|---|
| **Pink** | `--pastel-pink` | `#FFD4DE` | **Primary CTA** | Main action buttons, active state in `BottomNav`, the hero card on home. The product's signature surface. |
| **Lavender** | `--pastel-lavender` | `#E4D6F0` | **Secondary / editorial accent** | Secondary buttons, article tags, list-bullet circles in `.article-prose`. Pairs with `--accent-purple` for text. |
| **Mint** | `--pastel-mint` | `#D0EDE2` | **Success / positive** | D-day badges, completion states, "you're on track" indicators. Pairs with `--accent-green`. |
| **Peach** | `--pastel-peach` | `#FFE0CC` | **Data / tracking** | Weight-tracking cards, body-data surfaces, the `.article-prose` blockquote tip surface. |
| **Yellow** | `--pastel-yellow` | `#FFF4D4` | **Info / tip** | Information callouts, author notes, soft warning surfaces. Never used for primary actions. |

**Pastel application pattern.** Pastels are most often used at fractional alpha
(`bg-pastel-pink/40`, `bg-pastel-lavender/30`, `bg-pastel-yellow/20`) so they read as
**tinted air over the cream canvas**, not solid blocks. Full-opacity pastel surfaces
are reserved for primary CTAs (pink) and the hero card.

The hover variant of pink is pre-defined as `--pastel-pink-hover` (`#F5CADA`). For other
pastels, use `/80` alpha as the hover treatment.

### 2.3 Accent Colors — Type & Iconography

These are saturated companions to the pastels. Use them as **text and icon color on
pastel surfaces**, never as page-level fill.

| Accent | Token | Hex | Pairs with | Use |
|---|---|---|---|---|
| Warm Purple | `--accent-purple` | `#6B5A80` | Lavender | Article tag text, editorial link color in `.article-prose`, the dialog primary action in `BabyfairCard`. The brand's most-used "emphasis" tone. |
| Purple Hover | `--accent-purple-hover` | `#4A3D5C` | — | Press / hover variant. |
| Olive | `--accent-olive` | `#8B7520` | Yellow | Gold/olive label text on yellow info surfaces. |
| Green | `--accent-green` | `#2D6B4F` | Mint | Success label text, D-day count text. |
| Green Light | `--accent-green-light` | `#3D7A5F` | Mint | Lighter success text on busy backgrounds. |
| Red | `--accent-red` | `#B04060` | Pink | Sparingly used for destructive accents and warning emphasis. The system uses `--destructive` (`#F07088`) for actual destructive actions; reserve `--accent-red` for editorial emphasis only. |

### 2.4 Article-Prose Reading Palette

The `.article-prose` selector defines its own internal palette via CSS custom properties
prefixed with `--prose-*`. These are scoped to long-form reading and should not leak into
chrome:

- `--prose-heading: #3D4447` — inherits from foreground
- `--prose-body: #52585C` — slightly muted body, more relaxed than chrome text
- `--prose-muted: #7A7F83` — captions and asides inside articles
- `--prose-accent: #6B5A80` — link color, ordered-list numerals
- `--prose-tip-bg: #FFF4ED` + `--prose-tip-border: #FFD4B8` — peach-tinted blockquote / tip box
- `--prose-divider: #F0EBE6` — `<hr>` and table borders inside prose
- `--prose-surface: #FFF8F4` — table header background

When building article-adjacent components (CTAs at the foot of an article, "related
content" cards), pull from the prose palette instead of the chrome tokens so the
adjacent UI feels integrated with the reading flow.

---

## 3. Typography

### 3.1 Font Stack

The entire system runs on **Pretendard Variable** — a Korean-optimized humanist sans
designed for screen reading. Loaded from CDN in [globals.css](src/app/globals.css#L1)
and applied globally via `* { font-family: ... }`.

```
Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont,
system-ui, Roboto, "Helvetica Neue", sans-serif
```

There is no separate display face, no serif, no monospace. The single-stack discipline
is a brand decision — Pretendard's weight range (100–900 variable) covers display
through caption without needing a second face.

### 3.2 Hierarchy

Heading sizes are defined globally in [globals.css `@layer base`](src/app/globals.css#L405-L424).
**Don't restate them with inline classes**; rely on the global `h1`–`h4` styles unless
you need a non-semantic display size.

| Role | Selector / Class | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|---|
| Display | `h1` (global) | `text-2xl` (1.5rem) | 700 | 1.35 | -0.025em | Page hero titles |
| Section | `h2` (global) | `text-xl` (1.25rem) | 600 | 1.4 | -0.02em | Major section breaks |
| Sub-section | `h3` (global) | `text-lg` (1.125rem) | 600 | 1.45 | -0.01em | Card titles, list section heads |
| Card title | `h4` (global) | `text-base` (1rem) | 600 | 1.5 | — | Compact card / list-item titles |
| Body | (default) | `text-base` | 400 | 1.5 | — | Default running text |
| Small body | `text-sm` | 0.875rem | 400 | — | — | Secondary body, descriptions |
| Caption | `text-xs` | 0.75rem | 400 | — | — | Metadata, timestamps, badge body |
| Micro | `text-[11px]` | 11px | 500 | — | — | Subcategory labels, dense chips |
| Button | `button` (global) | `text-base` | 600 | 1.5 | — | Standard button text |
| Label | `label` (global) | `text-base` | 500 | 1.5 | — | Form labels |

### 3.3 Article Prose Hierarchy

Inside `.article-prose`, **headings shrink** because article body text already runs at
0.9375rem (15px). This is intentional — the smaller display sizes feel editorial, like
a magazine column, rather than billboard-y.

| Selector | Size | Weight | Treatment |
|---|---|---|---|
| `.article-prose h2` | 1.125rem | 700 | Bottom-bordered (1.5px solid `--prose-divider`), 2.5em top margin. The horizontal rule under each h2 is the article's primary pacing device. |
| `.article-prose h3` | 1rem | 600 | No border. 2em top margin. |
| `.article-prose p` | 0.9375rem | 400 | Line height 1.85, letter-spacing -0.008em, `word-break: keep-all`. |
| `.article-prose strong` | inherit | 600 | Color shifts to `--prose-heading` for legibility. |
| `.article-prose code` | 0.85em | 500 | Lavender chip background (`#F4EEF8`), purple text (`--prose-accent`). |

### 3.4 Korean Typography Rules

These are non-negotiable on long-form Korean text:

- **`word-break: keep-all`** — never break inside a Korean word. Already set on
  `.article-prose`. Apply manually on any paragraph block that wraps Korean prose.
- **Slight negative letter-spacing on display sizes** (`-0.02em` to `-0.025em`)
  tightens Korean blocks without crushing them. Don't go past `-0.03em`.
- **`-webkit-font-smoothing: antialiased`** is set globally on body. Don't override.
- **Numerical and English mixed-content** in Korean prose reads better at the same
  weight as the surrounding Korean — don't bold mixed digits.

---

## 4. Layout

### 4.1 Spacing System

The project follows the standard Tailwind 4-based scale (4px base unit). Common
rhythms observed:

| Scale | Tailwind | Use |
|---|---|---|
| 4px | `gap-1` / `p-1` | Inline pill internals, dense badge padding |
| 8px | `gap-2` / `p-2` | Standard small spacing, nav item internals |
| 12px | `gap-3` / `p-3` | Card content spacing |
| 16px | `gap-4` / `p-4` | Page horizontal margin (`px-4`), card body padding |
| 24px | `gap-6` / `p-6` | Card outer padding (`Card` UI primitive uses `px-6 py-6`) |
| 32px | `mb-8` | Major section bottom spacing |
| 56px | `pt-14` | Hero top padding |
| 96px | `pb-24` | Page bottom padding to clear `BottomNav` |

### 4.2 Page Wrapper

There is **no enforced `max-w-*` container**. Every page top-level wrapper follows:

```tsx
<div className="min-h-screen pb-24 px-4">
  {/* page content */}
</div>
```

`pb-24` (6rem) is mandatory on any page that renders inside the app shell — it clears
the fixed `BottomNav`. `px-4` is the default horizontal margin. Don't introduce a
`container` wrapper on existing pages; the design is mobile-first and a wide
desktop layout is not part of the current product surface.

### 4.3 Vertical Rhythm

- Between major sections inside a page: `mb-8` (32px).
- Between cards in a list: `space-y-3` or `space-y-4`.
- Inside a card between title and body: `gap-2` or `gap-3`.
- Hero block padding: `pt-14 pb-8` (56px / 32px).

### 4.4 Bottom Navigation Clearance

`BottomNav` is a fixed footer on every primary page. Always:
- Add `pb-24` to the page wrapper.
- Add `bottom-nav-safe` (defined in [globals.css](src/app/globals.css#L397-L399))
  to the nav itself when modifying it — it adds `env(safe-area-inset-bottom)` for
  iOS home-indicator clearance.
- For floating action buttons (FAB), use the `fab-bottom-safe` utility (also in
  globals.css) — it positions FABs above the nav with safe-area awareness.

---

## 5. Shapes

### 5.1 Border Radius Scale

The system has a single canonical radius (`--radius: 0.875rem` / 14px) with a derived
scale. In Tailwind: `rounded-md` ≈ 12px, `rounded-lg` = 14px, `rounded-xl` = 18px,
`rounded-2xl` = 16px (Tailwind default — used widely on cards in the codebase).

| Token | Value | Use |
|---|---|---|
| `rounded-md` | 12px | Subcategory chips, small inline badges |
| `rounded-lg` | 14px (`var(--radius)`) | Article tags, default UI primitives |
| `rounded-xl` | 18px | Standard buttons (the most common button radius in the app) |
| `rounded-2xl` | 16px | Card containers, hero cards, week badges. The dominant card radius. |
| `rounded-3xl` | 24px | Reserved for hero illustration cards if needed |
| `rounded-full` | pill / circle | Icon buttons, avatars, dot indicators, week badges (when circular) |

**Card vs. button convention:** cards use `rounded-2xl`, buttons use `rounded-xl`. The
slight contrast (16 vs 18) is intentional — the button radius is *more* round so
buttons feel softer and more tappable than the cards they sit on.

### 5.2 Hairline & Whisper Borders

All borders in the chrome use `rgba(0, 0, 0, 0.05)` (the `--border` token, also
expressible as `border-black/4` or `border-black/5` in Tailwind opacity shorthand).
Anything heavier reads as harsh. Pastel-tinted feature surfaces use the same alpha but
on the pastel tone:

```tsx
border border-pastel-peach/40   // peach-tinted hairline
border border-pastel-yellow/40  // yellow-tinted hairline
```

This pattern is observed on data and info surfaces — the border picks up the surface's
own pastel rather than fading to neutral.

---

## 6. Elevation & Depth

### 6.1 Shadow Scale

Defined in [`@theme inline`](src/app/globals.css#L156-L160). The scale is custom-tuned
for soft elevation; **do not use Tailwind's default shadow utilities without checking
the resolved value** — Tailwind classes (`shadow-sm`, `shadow`, etc.) resolve to these
custom multi-layer stacks via the theme override.

| Class | Stack | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)` | Card at rest. The dominant elevation. |
| `shadow` | `0 1px 3px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.03)` | Slight lift. |
| `shadow-md` | `0 2px 4px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.04)` | Card hover, form cards (input-bearing surfaces). |
| `shadow-lg` | `0 4px 6px rgba(0,0,0,0.03), 0 12px 28px rgba(0,0,0,0.05)` | Hero illustrations, FAB, prominent content card. |
| `shadow-xl` | `0 8px 12px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.07)` | Reserved for modals, sheets, high-emphasis floating elements. Rarely used in pages. |

### 6.2 Elevation Levels

| Level | Treatment | Example |
|---|---|---|
| Flat | No shadow, no border | Page canvas itself, body text blocks |
| Whisper | `border border-black/4` only | Sub-nav, dividers, inline chips |
| Resting card | `bg-card border border-black/4 shadow-sm rounded-2xl` | Default content card. The single most-used pattern in the app. |
| Hovered card | Add `hover:shadow-md` | List card with interaction. Don't change scale or border. |
| Form / data card | `shadow-md` at rest | Weight-tracking form, charts. The slightly heavier shadow signals input-bearing. |
| Hero / floating | `shadow-lg` | Hero image, FAB. |

The philosophy is **whisper-first**: most surfaces sit at `shadow-sm` or no shadow at
all, lifted only on user interaction or for the single hero piece per page.

### 6.3 Decorative Depth

- **Backdrop blur** is used only on the `BottomNav` (`bg-white/90 backdrop-blur-xl`)
  for a frosted-glass effect over scrolling content. Don't apply backdrop blur
  elsewhere — it's a bottom-nav-only signature.
- **Pastel-tinted surfaces** (`bg-pastel-yellow/20`, `bg-pastel-peach/10`) supply
  depth via color, not shadow. A pastel-tinted card typically uses `shadow-sm` or
  no shadow — the color is the elevation cue.

---

## 7. Components

### 7.1 Buttons

**Primary — pastel pink.** The product's signature CTA.
```tsx
className="bg-pastel-pink text-foreground hover:bg-pastel-pink-hover
           rounded-xl px-6 py-3 h-10 font-semibold"
```
Text stays at `text-foreground` (warm dark gray), never white — the pink is light
enough that white text would lose contrast.

**Secondary — pastel lavender.**
```tsx
className="bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80
           rounded-xl px-6 py-3 h-10 font-semibold"
```

**Ghost / Icon button.**
```tsx
// shadcn ghost variant
<Button variant="ghost" className="rounded-xl bg-muted hover:bg-muted/80" />
```

**Editorial / dialog action — accent purple.** Used inside modal dialogs and on
pages where the page's surface is already pastel pink (so a pink CTA would clash).
```tsx
className="bg-accent-purple hover:bg-accent-purple/90 text-white
           rounded-xl px-6 py-3 h-10 font-semibold"
```

**Don't:** use `bg-primary` from the shadcn `Button` primitive directly on app
pages — it resolves to pastel pink via the theme, but app code prefers explicit
`bg-pastel-pink` for clarity. The `Button` primitive is fine for forms and dialogs
where the shadcn defaults match.

### 7.2 Cards

**Default content card** — the most-used pattern in the codebase.
```tsx
className="rounded-2xl border border-black/4 bg-card text-card-foreground
           shadow-sm hover:shadow-md transition-shadow"
```

**Form / data card** — slightly lifted at rest.
```tsx
className="rounded-2xl border border-black/4 bg-card shadow-md"
```

**Pastel feature card** — used for info, tip, and data surfaces.
```tsx
// info / tip surface
className="rounded-2xl border border-pastel-yellow/40 bg-pastel-yellow/20"

// data / tracking surface
className="rounded-2xl border border-pastel-peach/40 bg-pastel-peach/10"
```

The `Card` UI primitive in [src/components/ui/card.tsx](src/components/ui/card.tsx)
uses `rounded-xl` and `px-6 py-6` — fine for shadcn-driven forms and dialogs, but
**page-level cards prefer `rounded-2xl`** to match the broader app rhythm.

### 7.3 Badges & Pills

**Article tag pill** — lavender + purple.
```tsx
className="bg-pastel-lavender/30 text-accent-purple text-xs
           px-2 py-0.5 rounded-lg border-0"
```

**Subcategory chip** — micro-label.
```tsx
className="text-[11px] px-2 py-0.5 rounded-md
           bg-pastel-lavender/30 text-foreground"
```

**Week / D-day badge** — circular or rounded.
```tsx
className="rounded-2xl w-14 h-14 flex items-center justify-center
           shadow-sm border border-black/4"
// color is set via inline style prop, drawn from pastel palette
```

**Rule:** badges never carry a visible border on a contrasting background — the
`border-0` override on the article tag is intentional. Borders appear only on
neutral cards, not pastel chips.

### 7.4 Bottom Navigation

```tsx
className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl
           border-t border-black/4 px-2 py-2 z-50 bottom-nav-safe"
```

- **Active item:** `bg-pastel-pink/40 text-foreground rounded-2xl px-3 py-2`
- **Inactive item:** `text-muted-foreground hover:text-foreground` (no background)
- The frosted-glass backdrop is the BottomNav's signature — don't replace it with
  a solid fill.

### 7.5 Inputs

```tsx
className="bg-input-background text-foreground border border-black/5
           rounded-xl px-4 h-10 placeholder:text-muted-foreground
           focus:outline-none focus:ring-2 focus:ring-ring"
```

- Background uses `--input-background` (`#FFFBF8`) — slightly warmer than card.
- Focus ring uses `--ring` (resolves to `--pastel-pink`) — the brand pink reappears
  as the focus signal.

### 7.6 Article Surface (`.article-prose`)

Apply `.article-prose` to a single wrapper around rendered article HTML. Don't nest
it. Don't override its child rules with utility classes — if a rule needs to change,
edit the selector in [globals.css](src/app/globals.css#L163-L379). Article-adjacent
components (related-content cards, foot CTAs) live **outside** the prose wrapper but
should pull from the `--prose-*` palette to stay in tone.

---

## 8. Responsive Behavior

### 8.1 Breakpoints

The product is **mobile-first**. Tablet and desktop behaviors are present but minimal.

| Tier | Width | Behavior |
|---|---|---|
| Mobile | < 640px | Default. Single column. `px-4` outer margin. `BottomNav` visible. This is the design target. |
| Tablet | 640–1024px | Same single-column layout, slight margin increase. Cards may grow to wider single-column. |
| Desktop | > 1024px | The product is currently mobile-shaped. There's no multi-column desktop layout; the page centers naturally because no `max-w-*` is enforced and content widths are mobile-sized. Don't introduce a desktop multi-column without an explicit redesign. |

### 8.2 Touch Targets

- All interactive items target ≥ 40px height (`h-10`).
- BottomNav items use `py-2` padding — combined with the icon + label, the tap
  target exceeds 44px.
- Pill badges are visual only; they're not tap targets unless wrapped in a button.

---

## 9. Iconography & Imagery

- **Icons:** lucide-react throughout. Keep stroke at default; size at `w-4 h-4`
  (inside text), `w-5 h-5` (button icons), `w-6 h-6` (nav).
- **Article hero images:** rendered from MDX/CMS frontmatter, displayed inside a
  `rounded-2xl` container with `shadow-lg`. Always include alt text.
- **No photographic chrome.** The product avoids stock imagery in marketing
  surfaces — the warmth comes from the cream canvas and pastel accents, not photos.

---

## 10. Do's and Don'ts

### Do
- Anchor every page on the cream canvas (`bg-background`). The warmth is the brand.
- Use `.article-prose` for any rendered long-form Korean text. Don't restyle
  paragraphs ad-hoc.
- Reserve each pastel for its assigned role (pink=primary, lavender=secondary,
  mint=success, peach=data, yellow=info).
- Use whisper borders (`border-black/4`) and the custom shadow scale.
  `shadow-sm` is the default; lift to `shadow-md` only on hover or for
  input-bearing cards.
- Use `rounded-2xl` for cards and `rounded-xl` for buttons.
- Apply `pb-24` to every page wrapper to clear the `BottomNav`.
- Apply `word-break: keep-all` on any new paragraph block holding Korean prose
  outside `.article-prose`.

### Don't
- Don't use pure white as the page background. The cream is the brand differentiator.
- Don't introduce a sixth pastel or remap the existing five. The role mapping is the
  system's discipline.
- Don't bold the Korean body text wholesale — Pretendard at weight 400 with
  line-height 1.85 is already fully legible. Bold only `<strong>` and short emphasis.
- Don't use `text-white` on pastel pink CTAs. Pink is light; white loses contrast.
  Use `text-foreground` (`#3D4447`) on pink and lavender; reserve `text-white` for
  the `accent-purple` and `accent-red` saturated buttons.
- Don't use heavy shadows. Anything past `shadow-lg` is reserved for modals.
- Don't introduce `max-w-7xl` or a desktop container around existing pages — the
  app is mobile-first by design.
- Don't put the frosted-glass `backdrop-blur-xl` anywhere except the `BottomNav`.
- Don't use the dark-mode tokens (the `.dark` class block in globals.css exists for
  future use but is not part of the current brand surface). The product is
  light-only.

---

## 11. Agent Prompt Examples

### Build a content card
> Create a list card for an article. Use `rounded-2xl border border-black/4
> bg-card shadow-sm hover:shadow-md` as the container. Inside, place a `text-base
> font-semibold text-foreground` title, a `text-sm text-muted-foreground`
> description, and a tag pill at the top using `bg-pastel-lavender/30
> text-accent-purple text-xs px-2 py-0.5 rounded-lg border-0`.

### Build a CTA button
> Render the primary CTA as `<button className="bg-pastel-pink text-foreground
> hover:bg-pastel-pink-hover rounded-xl px-6 h-10 font-semibold">`. Don't use
> `text-white`; the pink is light enough that the warm dark `text-foreground`
> reads better.

### Build an info callout
> Wrap the callout in `rounded-2xl border border-pastel-yellow/40
> bg-pastel-yellow/20 p-4`. Title in `text-foreground font-semibold`, body in
> `text-sm text-foreground/80`. No shadow — the pastel surface itself is the
> elevation cue.

### Build an article page
> Wrap the rendered article HTML in a single `<article className="article-prose">`.
> Don't restyle h2/h3/p/ul/ol/blockquote/table — the `.article-prose` selector in
> `src/app/globals.css` already defines them. Place related-content cards
> outside the prose wrapper, styled with the chrome card pattern but using the
> `--prose-*` palette for any text colors that need to feel article-adjacent.

### Build a bottom-nav item
> Active item: `<Link className="bg-pastel-pink/40 text-foreground rounded-2xl
> px-3 py-2 flex flex-col items-center gap-1">`. Inactive item: same structure,
> swap to `text-muted-foreground hover:text-foreground` and remove the
> background. Icon at `w-6 h-6`, label at `text-xs`.

---

## 12. Iteration Guide

1. **Always work from tokens.** Reference `--background`, `--pastel-pink`,
   `--accent-purple`, etc. as defined in `src/app/globals.css`. Never inline a hex
   value that isn't already a token.
2. **One pastel per role.** When tempted to "use mint for an info card because it
   looks pretty," stop. Yellow is info; mint is success. The discipline is the
   system.
3. **Whisper-weight first.** Default to `border-black/4` and `shadow-sm`. Reach for
   heavier elevation only when the element is genuinely lifted (modal, FAB, hero).
4. **Korean reads better at weight 400.** Don't bold ambient text to add hierarchy
   — increase font size or use a heading instead.
5. **Articles are sacred.** Long-form prose lives inside `.article-prose`. If the
   styling needs to change, edit the global selector — don't override per-page.
6. **Mobile-first means mobile-only by default.** Add desktop variants only if the
   feature explicitly calls for one.
7. **The cream + pink + warm-purple trio is the brand.** Mint, peach, yellow are
   functional. Don't reverse the priority — a page that leads with mint reads as a
   different product.
