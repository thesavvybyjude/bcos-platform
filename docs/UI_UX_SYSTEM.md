# BCOS Platform — UI/UX Design System & Specification

**Version:** 1.0.0  
**Target Audience:** Frontend Engineers, UI/UX Designers, Product Managers  
**Guiding Design Principle:** The BCOS UI/UX is built to provide an ultra-premium, dark-mode-first, high-density enterprise intelligence interface. Every pixel emphasizes speed, visual clarity, glassmorphism aesthetics, and effortless navigation across 249+ business context modules.

---

## 🎨 Design Philosophy & Principles

### 1. High-Density Enterprise Intelligence
Business leaders and AI engineers need instant access to principles, rules, and decision frameworks. The layout avoids unnecessary fluff, using tight vertical rhythm and clean grid systems to maximize data density without visual clutter.

### 2. Dark-Mode-First & Glassmorphism
The interface uses deep space backdrops (`#020617` Slate-950) with frosted glass container overlays (`bg-white/[0.03] backdrop-blur-xl border-white/5`), dynamic ambient radial glows, and electric indigo highlights (`#5c7cfa`).

### 3. Immediate Visual Differentiation
Operational content is categorized visually:
- **Principles:** Icon-anchored cards with distinct numbering and source quotes.
- **Typed Rules:** Color-coded border indicators (Emerald for *Always*, Red for *Never*, Amber for *Avoid*, Blue for *Prefer*).
- **Decision Trees:** Step-by-step logic flows with condition/action branching cards.
- **Departments:** Color-coded department pill badges.

---

## 📐 Color Palette & Token System

### Base Surface Palette (Slate Dark Scale)
| Token | Hex / Value | Usage |
|---|---|---|
| `--bg-primary` / `surface-900` | `#020617` | Main viewport backdrop |
| `--bg-secondary` / `surface-800` | `#0f172a` | Sidebar, cards, popovers, headers |
| `--bg-tertiary` / `surface-700` | `#1e293b` | Borders, subtle dividers, hover backdrops |
| `--border-color` | `#1e293b` | Primary container borders |

### Brand Accent Palette (Electric Indigo)
| Token | Hex / Value | Usage |
|---|---|---|
| `brand-300` | `#91a7ff` | Subtle text highlights, active state gradients |
| `brand-400` | `#748ffc` | Secondary button text, icons |
| `brand-500` / `--accent` | `#5c7cfa` | Primary buttons, active indicators, interactive elements |
| `brand-600` | `#4c6ef5` | Button hover states |
| `brand-700` | `#4263eb` | Active focus rings |
| `--accent-glow` | `rgba(92, 124, 250, 0.15)` | Dynamic card hover glow & radial spotlight |

### Semantic System Colors
| Context | Color / Class | Border Indicator | Usage |
|---|---|---|---|
| **Always (Rule)** | `#34d399` Emerald | `border-l-2 border-emerald-500` | Mandatory operational directives |
| **Never (Rule)** | `#f87171` Red | `border-l-2 border-red-500` | Prohibited actions & anti-patterns |
| **Avoid (Rule)** | `#fbbf24` Amber | `border-l-2 border-amber-500` | Cautionary guidelines & friction risks |
| **Prefer (Rule)** | `#60a5fa` Blue | `border-l-2 border-blue-500` | Recommended default practices |

### Department Badges
- **Marketing:** `bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20`
- **Business / Finance:** `bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20`
- **Operations / CEO:** `bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20`
- **Technology / AI:** `bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20`

---

## 🔤 Typography & Font Hierarchy

The BCOS Platform utilizes **Inter** for clean UI readability and **JetBrains Mono** for code snippets, JSON payloads, and system prompt compilations.

### Font Scale
| Element | Font Family | Weight | Size / Line Height | Tailwind Class |
|---|---|---|---|---|
| **Hero Heading** | Inter | 800 (ExtraBold) | 2.25rem / 2.5rem | `text-4xl font-extrabold tracking-tight` |
| **Section Title** | Inter | 700 (Bold) | 1.5rem / 2rem | `text-2xl font-bold` |
| **Card Title** | Inter | 600 (SemiBold) | 1.125rem / 1.75rem | `text-lg font-semibold` |
| **Body Text** | Inter | 400 (Regular) | 0.875rem / 1.25rem | `text-sm text-slate-300` |
| **Muted Text** | Inter | 400 (Regular) | 0.75rem / 1rem | `text-xs text-slate-500` |
| **Code & Markdown** | JetBrains Mono | 500 (Medium) | 0.8125rem / 1.25rem | `font-mono text-xs text-slate-200` |

---

## 🧩 Component Architecture & Specs

### 1. Glassmorphic Card (`.glass-card`)
- **Background:** `bg-white/[0.03]` with `backdrop-blur-xl`
- **Border:** `border border-white/5`
- **Box Shadow:** `0 0 40px rgba(92, 124, 250, 0.04)`
- **Hover Transition:** `transition-all duration-300 hover:border-brand-500/20 hover:shadow-[0_0_60px_rgba(92,124,250,0.08)]`

### 2. Search & Command Bar (`SearchBar.tsx`)
- **Shortcut:** `⌘K` or `/` focus key binding.
- **State:** Debounced input query with instant live RAG results preview modal.
- **Focus Ring:** `focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500`.

### 3. Module Card Grid (`ModuleCard.tsx`)
- **Structure:** Department badge header, module title, truncated purpose statement, count chips for principles (`37`), rules (`8`), and decision trees (`2`).
- **Interactive State:** Hover elevation with smooth `translate-y-[-2px]`.

### 4. Interactive Knowledge Graph (`ForceGraph.tsx` & `KnowledgeGraph.tsx`)
- **Engine:** 2D Canvas force-directed graph renderer with zoom/pan controls.
- **Node Styling:** Department-colored glowing nodes with radius proportional to module cross-reference degree.
- **Edge Styling:** Semi-transparent directional links with target slug relationship labels.

### 5. Context Builder (`/context`)
- **Selection Drawer:** Checkbox list of 249 modules with department filter.
- **Live Markdown Preview:** Monospace code block showing compiled system prompt ready for single-click "Copy to Clipboard" or "Export Prompt".

---

## 💫 Micro-Animations & Transitions

```css
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-slide-up { animation: slideUp 0.5s ease-out; }
```

---

## 📱 Layout Grid & Responsive Breakpoints

| Device Class | Breakpoint | Column Layout | Sidebar Behavior |
|---|---|---|---|
| **Mobile** | `< 640px` | 1 Column | Collapsed into drawer menu |
| **Tablet** | `640px – 1024px` | 2 Columns | Icon-only collapsible rail |
| **Desktop** | `1024px – 1536px` | 3 Columns | Fixed 256px sidebar |
| **Ultra-Wide** | `> 1536px` | 4 Columns | Fixed 280px sidebar with extended context preview |

---

## ♿ Accessibility & Standards Compliance

1. **Color Contrast:** All body text (`#f8fafc` on `#020617`) achieves WCAG AAA contrast ratio (> 12:1).
2. **Keyboard Navigation:** Full tab ordering across navigation sidebar, search inputs, modal drawers, and module detail tabs.
3. **Screen Readers:** ARIA landmarks (`role="navigation"`, `role="search"`, `role="main"`) implemented across layout components.
4. **Reduced Motion:** Respects `prefers-reduced-motion` media queries by suppressing slide-up keyframe animations.
