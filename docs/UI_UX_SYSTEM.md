# UI_UX_SYSTEM.md — Permanent UI/UX Design Authority

## Purpose

This document is the **permanent UI/UX design authority** for this project.

Whenever a new page, component, modal, dashboard, workflow, graph, or feature is created or modified, it MUST comply with this document.

Never optimize a single screen in isolation.

Always optimize the entire product — every rule below applies system-wide, not per-screen.

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
* elements sitting outside the grid or layout rhythm
* elements that no longer serve the screen's purpose but were never removed

Fix every issue before considering the task complete.

---

# Element Placement Audit

Run this pass on every screen, every time — not just at initial build.

For every element on the screen, check:

* Is it positioned where its function suggests it should be (primary action bottom-right or top-right per platform convention, destructive actions separated from safe ones, back/close controls in the expected corner)?
* Is it grouped with the elements it's logically related to, and separated from elements it isn't?
* Is it aligned to the grid, or floating at an arbitrary offset?
* Did it get left behind after a layout change (orphaned element, leftover spacer, component that no longer matches the section around it)?
* Does its size/prominence match its actual importance (a secondary action should never visually outweigh the primary one)?

If an element fails any of these, move it to where it belongs, regrouping and realigning the surrounding layout rather than nudging it in isolation. Treat this as a required pass before any screen is considered done, not an optional cleanup step.

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

Maintain consistent line-height, letter spacing, font weight, and paragraph spacing.

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

`Hover` | `Focus` | `Pressed` | `Loading` | `Disabled` | `Empty` | `Success` | `Error` | `Selected`

Nothing should feel static.

Every hover must change something meaningful — never a bounce or scale applied identically everywhere with no functional reason.

An action's label must match its outcome: a button that says "Save changes" produces a confirmation that says "Saved," not generic filler. The vocabulary stays consistent through the whole flow.

Error and empty states speak in the interface's own voice: state what happened (or what's missing) and the next action available. Never vague ("Something went wrong"), never apologetic filler.

---

# Motion

Motion should explain, never decorate.

Animations should: guide attention, confirm actions, reduce cognitive load.

Target speed: **150–300ms**.

---

# Responsive Rules

Every feature must function on: Mobile, Tablet, Laptop, Desktop, Ultrawide, 4K.

No broken layouts. No clipped text. No horizontal scrolling. No overlapping components.

This applies to every screen in the system, including ones added later — a new screen is not complete until it has been checked at every breakpoint above, not just the one it was designed in.

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

As screen size changes, everything scales proportionally — including typography, cards, buttons, icons, graph nodes, sidebars, panels, tables, forms, charts, and canvases.

Spacing expands on larger displays and compresses gracefully on smaller ones while keeping readability and balance.

Nothing should appear stretched. Nothing should become cramped.

This scaling behavior is a system-wide requirement — verify it on every screen, not only the ones it was first built for.

---

# Accessibility

Keyboard navigation, visible focus, ARIA labels, WCAG AA contrast, reduced motion support, screen reader support, large click targets, readable typography.

Accessibility is required. Never optional.

Recheck contrast anywhere text sits on a gradient, image, or translucent surface — these are the cases most likely to silently fail AA.

---

# Theme System

Support: **Light Mode**, **Dark Mode**, and **System Theme**.

Every component must work perfectly in every theme — this is a system-wide requirement, verified on every screen and every state (hover, focus, disabled, error, empty, loading), not just the default view.

Theme switching updates every one of: backgrounds, cards, borders, typography, icons, graphs, charts, shadows, hover states, focus states, and selection states. Missing even one of these under a theme change counts as a broken component.

Never hardcode colors. Always use design tokens.

A component that only looks right in one theme is not finished.

---

# Modular Screen System

The product is a set of modules, not a set of one-off screens. Before any module is considered complete, it must include every screen its function requires — nothing is "just the main view."

Every module needs, at minimum:

* Index / list view (with empty, loading, and error states)
* Detail / item view
* Create / edit view (with validation and inline error states)
* Search & filter (when the module has more than a handful of items)
* Empty state specific to that module, not a generic placeholder

This applies to every functional area of the product, including ones that are easy to treat as an afterthought — for example, a **Knowledge Base** module needs its own index, category/collection view, article/item detail view, search, and empty state (no results, no articles yet), styled with the same tokens and interaction rules as the rest of the system, not bolted on separately.

Before marking any feature complete, confirm every module in the product has:

* An index or entry screen
* A detail screen
* A way to create or add to it (if applicable)
* Empty, loading, and error states
* Settings/configuration screen, if the module has configurable behavior

A module missing any of these is incomplete, even if its main screen looks finished.

### Named modules for this product

Each of these gets its own dedicated workspace — never overload one screen with another module's responsibility:

Dashboard · Knowledge Graph · Knowledge Base · Knowledge Item Viewer · Document Viewer · Module Explorer · Search · AI Chat · Orchestrator · Context Builder · Analytics · Timeline · Settings · Collections · Tags · Workflows · Integrations · Tasks · Relationships · Version History · Administration

Every module in this list follows the same index / detail / create-edit / empty-loading-error requirements above, and shares the same design tokens, interaction rules, and theme support as the rest of the system.

### Knowledge Base experience

Knowledge items never exist only as graph nodes. Every knowledge object gets its own dedicated interface covering: viewing, editing, relationships, metadata, history, AI summaries, references, and linked resources.

Users move seamlessly between Knowledge Graph ↔ Knowledge Base ↔ Individual Knowledge Item ↔ Related Documents ↔ Relationships without losing context — the current item, selection, or scroll position survives the transition rather than resetting.

---

# Anti-AI Slop Rules

Never default to:

* purple or purple-to-cyan gradients
* three equal cards
* glassmorphism everywhere
* random floating blobs or gradient orbs
* oversized hero sections
* massive empty whitespace
* generic Lucide icon grids
* identical border radius everywhere
* identical shadows everywhere
* center everything
* neon glow on cards/borders as a default accent
* numbered markers (01/02/03) on content that isn't a real sequence
* default Inter/system-ui with no deliberate pairing decision
* marketing filler copy ("transform your workflow," "unlock your potential") in place of specific, functional copy

Instead:

Design around hierarchy. Design around purpose. Design around information density.

Every screen should feel unique while remaining part of one coherent system.

---

# Design Tokens

Every visual decision must originate from tokens: Typography, Spacing, Radius, Shadow, Border, Color, Animation, Opacity, Elevation.

Never hardcode values.

---

# Design Linting

Before every completion, perform a design review.

Verify:

✓ Layout consistency  
✓ Element placement (nothing out of position, orphaned, or misgrouped)  
✓ Typography consistency  
✓ Color consistency  
✓ Responsive behavior at every breakpoint  
✓ Light and dark theme parity  
✓ Accessibility  
✓ Alignment  
✓ Visual hierarchy  
✓ Empty state quality  
✓ Loading state quality  
✓ Error state quality  
✓ Interaction quality  
✓ Animation quality  
✓ Module completeness (every module has index, detail, create/edit, empty/loading/error)  
✓ Graph readability  
✓ Performance  
✓ Production readiness  

If any category fails, continue refining until all checks pass.

---

# Golden Rule

Every UI change must improve the product as a whole — not just the screen being edited.

The interface should look as though a senior product designer and design engineer refined every pixel with intention.

When in doubt:

Remove clutter. Increase hierarchy. Improve spacing. Simplify interactions. Preserve consistency. Optimize for humans first.
