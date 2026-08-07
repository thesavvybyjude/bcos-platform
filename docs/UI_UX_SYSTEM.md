# UI_UX_SYSTEM.md — Permanent UI/UX Design Authority

## Purpose

This document is the **permanent UI/UX design authority** for the BCOS Platform.

Whenever a new page, component, modal, dashboard, workflow, graph, or feature is created or modified, it **MUST comply with this document**.

Never optimize a single screen in isolation.

Always optimize the entire product.

---

## 🖼️ Application Screen Gallery & Layouts

Below are visual layouts built using the Lumina Enterprise design system:

### 1. Enterprise Command Center Dashboard
The main command center showcasing realtime stats (249 Modules, 3,731 Principles, 881 Rules, 64 Departments), system operational status, and high-frequency knowledge module cards with department badges.

![Dashboard Preview](assets/screens/dashboard.png)

---

### 2. Knowledge Module Directory & Browser (`/modules`)
A filterable, searchable directory listing all 249 business context modules across 64 departments with live search filters, principle counters, and rule indicators.

![Modules Directory Preview](assets/screens/modules.png)

---

### 3. RAG Semantic & Full-Text Search (`/search`)
Fast semantic vector search powered by ChromaDB (`all-MiniLM-L6-v2` embeddings) and full-text keyword indexing across all 3,731 principles and 881 operational rules.

![Search Interface Preview](assets/screens/search.png)

---

### 4. Dynamic Context Orchestrator (`/orchestrator`)
The visual query routing engine that matches user queries against the master `Orchestrator.md` routing table and identifies required context modules with relevance scores.

![Orchestrator Preview](assets/screens/orchestrator.png)

---

### 5. AI Context Compiler & Exporter (`/context`)
A self-service workspace allowing AI engineers to select specific business context modules and compile them into a unified, formatted Markdown payload ready for LLM system prompts.

![Context Compiler Preview](assets/screens/context_builder.png)

---

### 6. Interactive Knowledge Graph Studio (`/graph`)
An infinite canvas graph studio featuring D3 force physics, progressive detail disclosure across 5 zoom tiers, cursor-centered zooming, Ask Graph AI drawer, context menus, and theme switching.

![Knowledge Graph Preview](assets/screens/knowledge_graph.png)

---

# Core Philosophy

The UI should never look AI-generated.

It should feel intentionally designed.

Every screen should communicate:

* clarity
* hierarchy
* confidence
* breathing room
* consistency
* craftsmanship

If something looks "fine," continue refining until it feels designed.

---

# Global UI Audit

Whenever UI changes are made, automatically inspect the entire interface.

Look for:

* inconsistent spacing
* inconsistent typography
* inconsistent button sizing
* uneven padding
* alignment issues
* visual imbalance
* awkward empty space
* oversized sections
* tiny click targets
* duplicated patterns
* unnecessary borders
* inconsistent shadows
* inconsistent radii
* excessive colors
* low contrast
* accessibility failures
* responsiveness problems

Fix every issue before considering the task complete.

---

# Layout Rules

Design entire pages first.

Never build isolated components.

Every page should follow a consistent layout rhythm.

Maintain visual balance between:

Navigation | Canvas | Sidebars | Content | Footer | Dialogs | Floating Panels | Inspector Panels

Nothing should feel randomly placed.

---

# Grid System

Use a responsive grid.

- **Desktop:** 12 columns
- **Tablet:** 8 columns
- **Mobile:** 4 columns

Align components to the grid.

Never eyeball spacing.

---

# Spacing System

Only use the spacing scale:

`4` | `8` | `12` | `16` | `20` | `24` | `32` | `40` | `48` | `64` | `80` | `96` | `128`

Never invent random spacing values.

Whitespace is a design feature.

---

# Typography

Use one consistent typography scale:

- **Display:** 48px
- **H1:** 40px
- **H2:** 32px
- **H3:** 24px
- **H4:** 20px
- **Body:** 16px
- **Small:** 14px
- **Caption:** 12px

Maintain consistent: line-height, letter spacing, font weight, paragraph spacing.

Avoid walls of text.

---

# Color System

Limit colors:
- One primary accent (`#b8c4ff` / `#3b82f6`)
- One success (`#34d399` / `#10b981`)
- One warning (`#ffb77d` / `#f59e0b`)
- One danger (`#ffb4ab` / `#ef4444`)
- Neutral grayscale

Avoid rainbow dashboards. Color should communicate meaning—never decoration.

---

# Component Consistency

Buttons, Cards, Inputs, Dropdowns, Tables, Lists, Badges, Dialogs, Sidebars, Menus must all share:
- radius (`4px` / `8px` / `12px`)
- padding
- hover behavior
- focus behavior
- animation speed (`150ms–300ms`)
- shadow depth
- typography

---

# Interaction Rules

Every interactive element must provide feedback:

`Hover` | `Focus` | `Pressed` | `Loading` | `Disabled` | `Success` | `Error` | `Selected`

Nothing should feel static.

---

# Motion

Motion should explain, never decorate.

Animations should: guide attention, confirm actions, reduce cognitive load.

Target speed: **150–300ms**.

---

# Responsive Rules

Every feature must function on: Mobile, Tablet, Laptop, Desktop, Ultrawide, 4K.

No broken layouts. No clipped text. No horizontal scrolling. No overlapping components.

---

# Infinite Canvas Rules

Graphs, Mind Maps, Workflows, Knowledge Maps, Whiteboards must support:

* smooth zoom
* smooth pan
* infinite canvas
* fit-to-screen
* center selection
* minimap
* adaptive rendering
* progressive detail
* cluster spacing
* no node overlap

---

# Adaptive Scaling

As screen size changes: typography scales, spacing scales, cards resize, sidebars resize, panels resize, canvas expands.

Nothing should appear stretched. Nothing should become cramped.

---

# Accessibility

Support: Keyboard navigation, visible focus, ARIA labels, WCAG AA contrast, reduced motion support, screen reader support, large click targets, readable typography.

Accessibility is required. Never optional.

---

# Theme System

Support: **Light Mode**, **Dark Mode**, and **System Theme**.

Every component must work perfectly in every theme. Never hardcode colors. Always use design tokens (`var(--bg-primary)`, `var(--text-primary)`, `var(--accent)`).

---

# Anti-AI Slop Rules

Never default to:
- purple gradients
- three equal cards
- glassmorphism everywhere
- random floating blobs
- oversized hero sections
- massive empty whitespace
- generic icon grids
- center everything

Instead: Design around hierarchy. Design around purpose. Design around information density. Every screen should feel unique while remaining part of one coherent system.

---

# Design Tokens

Every visual decision must originate from tokens: Typography, Spacing, Radius, Shadow, Border, Color, Animation, Opacity, Elevation.

Never hardcode values.

---

# Design Linting

Before every completion, perform a design review.

Verify:
- ✓ Layout consistency
- ✓ Typography consistency
- ✓ Color consistency
- ✓ Responsive behavior
- ✓ Accessibility
- ✓ Alignment
- ✓ Visual hierarchy
- ✓ Empty state quality
- ✓ Loading state quality
- ✓ Error state quality
- ✓ Interaction quality
- ✓ Animation quality
- ✓ Theme compatibility
- ✓ Graph readability
- ✓ Performance
- ✓ Production readiness

If any category fails, continue refining until all checks pass.

---

# Golden Rule

Every UI change must improve the product as a whole—not just the screen being edited.

The interface should look as though a senior product designer and design engineer refined every pixel with intention.

When in doubt: Remove clutter. Increase hierarchy. Improve spacing. Simplify interactions. Preserve consistency. Optimize for humans first.
