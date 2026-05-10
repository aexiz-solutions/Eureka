# 📐 EUREKA — FRONTEND DESIGN REFERENCE
## Visual Identity · Style Guide · Component Library · MVP
### Version: 1.0 · Last updated: May 2026

---

## Overview

This document is the human-readable companion to the **EUREKA_FRONTEND_CODEX**. The Codex is for AI assistants and code generation. This document is for developers and designers working on the project.

Both documents are in sync. The Codex is the implementation contract; this document explains the reasoning.

---

## 1. Design Philosophy

Eureka is a professional B2B tool used by merchandising teams inside retail companies. The users are not consumers — they're professionals who need to get data in, see a planogram, and move on.

**The design principle is: the interface disappears, the data doesn't.**

This means:
- No decorative elements that compete for attention
- No colours used for aesthetic reasons — only for meaning
- Consistent, predictable layouts so the user never has to think about where things are
- White space is generous but purposeful

The reference for the overall tone is the screenshot shared during setup (Super Admin · Pilot Onboarding). That page shows exactly how the product should feel across all pages: clean table rows, status badges, white background, blue as the sole action colour.

---

## 2. Colour System

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#FFFFFF` | All page and surface backgrounds |
| `--color-bg-subtle` | `#F7F8FA` | Sidebars, table alternates, input fills |
| `--color-bg-muted` | `#F0F2F5` | Hover state on rows, disabled inputs |
| `--color-blue-600` | `#2563EB` | Primary actions — all buttons, links, active tabs |
| `--color-blue-700` | `#1D4ED8` | Button hover state |
| `--color-blue-100` | `#DBEAFE` | Blue badge background |
| `--color-blue-800` | `#1E40AF` | Blue badge text |
| `--color-border` | `#E5E7EB` | Table lines, card edges, input borders |
| `--color-text-primary` | `#111827` | Headings, table data |
| `--color-text-secondary` | `#6B7280` | Meta text, captions, placeholders |

### Status Indicators (Red / Yellow / Green)

These three colours are reserved exclusively for status communication. They are never used for decoration.

| Status | Background | Text | When to use |
|--------|-----------|------|-------------|
| Green | `#DCFCE7` | `#16A34A` | Approved, success, high confidence, coverage > 75% |
| Yellow | `#FEF9C3` | `#854D0E` | Pending, warning, medium confidence, coverage 25–74% |
| Red | `#FEE2E2` | `#991B1B` | Rejected, error, low confidence, coverage < 25% |

### Planogram Canvas

The canvas is always white (`#FFFFFF`) with black (`#111827`) shelf lines and product borders. This is intentional — the planogram is a technical document, not a styled graphic. Product category colours (set by the backend engine) are the only colour variation inside the canvas.

**Category colours (from backend `CATEGORY_COLORS`):**

| Category | Hex |
|----------|-----|
| Dairy | `#4A90D9` (blue) |
| Beverages | `#7ED321` (green) |
| Snacks | `#F5A623` (orange) |
| Personal Care | `#9B59B6` (purple) |
| Household | `#E74C3C` (red) |
| Bakery | `#E67E22` (amber) |
| Frozen | `#1ABC9C` (teal) |
| Unknown | `#95A5A6` (grey) |

These colours only appear inside the Konva canvas. They do not appear in the surrounding UI.

---

## 3. Typography

**Primary font:** DM Sans (Google Fonts) — `400`, `500`, `600` weights only.

DM Sans was chosen because it's clean and professional without being generic (not Inter, not Roboto). It has good legibility at small sizes (table data at 14px) and looks authoritative at larger sizes (metric numbers at 24px).

**Monospace font:** JetBrains Mono — for SKU codes, slugs, and technical identifiers.

### Type Scale

| Role | Size | Weight | Colour |
|------|------|--------|--------|
| Page title (h1) | 20px | 600 | `text-gray-900` |
| Section heading (h2) | 16px | 600 | `text-gray-900` |
| Sub-heading (h3) | 14px | 500 | `text-gray-700` |
| Body / table data | 14px | 400 | `text-gray-900` |
| Secondary / captions | 12px | 400 | `text-gray-500` |
| Column headers | 12px | 600, uppercase | `text-gray-500` |
| Large metrics | 24px | 600 | `text-gray-900` |
| Monospace (SKU, slug) | 12px | 400–500 | `text-gray-600` on `bg-gray-100` |

---

## 4. Component Library

### Buttons

Three types, no exceptions for MVP.

**Primary (blue):** Used for the main action on a page. Examples: "Generate AI Planogram", "Upload File", "Save", "Approve". One primary button per view area.

**Secondary (outlined blue):** Used for supporting actions alongside a primary button. Examples: "Export ▼", "Regenerate", "Download Sample".

**Ghost (text only):** Used for low-emphasis actions. Examples: "Cancel", "Logout", "— (dismiss)". Also used for icon-only actions in tight spaces.

### Badges

Always small pills (`rounded-full`, `text-xs`). Four variants:

- **Green** — APPROVED, success, high confidence
- **Yellow** — PENDING, warning, medium confidence
- **Red** — REJECTED, error, low confidence
- **Blue** — counts, neutral info, active states

### Tables

All data tables follow the same pattern: white background, `divide-y` row dividers (not full borders), `hover:bg-gray-50` on rows, column headers in `uppercase text-xs text-gray-500`.

No zebra striping. Hover provides enough visual feedback.

Secondary information in a table cell (e.g. a "slug" below a brand name, or a review date below a status badge) goes inline below the primary value at `text-xs text-gray-500`.

### Cards

Used for stat metrics, section containers, and form panels.

Standard card: `bg-white border border-gray-200 rounded-lg p-6 shadow-sm`

Stat card: same structure, with a metric label at `text-xs uppercase`, large number at `text-2xl font-semibold`, and optional delta/sublabel at `text-xs text-gray-400`.

---

## 5. Page-by-Page Notes

### Login / Register

- Centered card on white page, no navigation
- "Eureka" wordmark as plain semibold text, no logo/icon for MVP
- Single primary button full-width for submit
- Link below for switching between login and register

### Dashboard (`/dashboard`)

The dashboard has two zones: a hierarchy tree (left or inline) and a content area (right or below). The tree shows Country → State → City → Locality → Store. The selected item is highlighted in `bg-blue-50 text-blue-700`.

The `DataHealthWidget` shows three progress bars per store: Sales data coverage, Product dimensions coverage, Category coverage. Bars are blue when healthy, yellow when partial, red when poor. This is the main nudge to improve data quality.

### Upload Hub (`/upload`)

Three tabs (Products | Sales | Stores) with a drag-and-drop zone per tab. The drop zone uses a dashed blue border on hover to communicate interactivity. After upload, the `ImportSummaryCard` shows rows processed, successes (green), errors (red), and a collapsible yellow section for SKU duplicate warnings.

### Store Landing (`/stores/[id]`)

One clear CTA: the "Generate AI Planogram" primary button. Supporting info (product count, sales data status, existing planograms) is below it. Readiness indicators are green/yellow/red badges next to each data type.

### Planogram Editor (`/stores/[id]/planogram/[pid]`)

The editor has four visual zones:

1. **Top bar** — store breadcrumb, `ConfidenceBadge`, Regenerate, Save, Export buttons
2. **Data quality banner** — shown only if `data_quality_warnings` exist; yellow for medium/low severity, persistent for high
3. **Editor area** — left product panel (`w-56`) + main Konva canvas
4. **Bottom status bar** — category legend, SKU count, data freshness

The canvas is the primary element. Everything else should feel like it's around the canvas, not competing with it.

### Super Admin (`/super-admin`)

Four metric stat cards at the top (Total Users, Total Stores, Total Planograms, Quota Utilisation).

Three tabs below: Onboarding | Users | Limits. The tab style here uses a solid dark pill for the active tab (as shown in the reference screenshot) — different from the underline tabs used elsewhere. This is intentional to visually distinguish the admin area.

The onboarding table is the reference implementation for all tables in the product.

---

## 6. Status Indicator Rules

This is the most important consistency rule in the product. Users learn to read badges by colour. Inconsistency breaks trust.

**Green** always means "good / done / approved / reliable".
**Yellow** always means "needs attention / partial / pending / uncertain".
**Red** always means "problem / blocked / rejected / unreliable".
**Blue** is for navigation, counts, and actions — never for status.

The `ConfidenceBadge` in the planogram editor is the most prominent use of RYG in the product. It must always match:
- High (score ≥ 0.75) → green badge, no banner
- Medium (score ≥ 0.45) → yellow badge, dismissible yellow banner
- Low (score < 0.45) → red badge, persistent non-dismissible red/amber banner

---

## 7. What This Design Is NOT

To avoid scope creep, explicitly noting what this MVP design excludes:

- **No dark mode.** Adds complexity without MVP value.
- **No animations beyond hover transitions.** No skeleton loaders that animate, no page transitions, no confetti.
- **No illustrations or icons as decoration.** Icons are functional (lucide-react) only.
- **No gradient fills on any UI surface.** Buttons, cards, nav bars — all solid.
- **No additional component libraries.** No shadcn, no Radix UI, no Headless UI. Tailwind + custom components.
- **No coloured page backgrounds.** Pages are always white or `#F7F8FA`.
- **No purple, pink, orange, or teal in the UI.** These colours are reserved for planogram category blocks inside the canvas only.

---

## 8. Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-05-10 | Initial design codex — established token system, component rules, RYG indicator semantics, page-specific guidance based on repo state and reference screenshot |

---

## 9. Files to Create / Modify

To apply this design system to the existing repo:

| File | Action | What to do |
|------|--------|-----------|
| `frontend/app/globals.css` | Modify | Add all CSS custom properties from Codex §2 |
| `frontend/app/layout.tsx` | Modify | Add Google Fonts link, apply body class with DM Sans |
| `frontend/components/ui/Badge.tsx` | Create | Reusable badge component with 5 variants |
| `frontend/components/ui/Button.tsx` | Create | Reusable button with 3 variants |
| `frontend/components/ui/Card.tsx` | Create | Card and StatCard wrappers |
| All existing page components | Modify | Replace hardcoded colours with token classes per Codex §4–5 |

Do not refactor component logic, Zustand stores, API calls, or Konva canvas interaction logic. Visual-only changes only.
