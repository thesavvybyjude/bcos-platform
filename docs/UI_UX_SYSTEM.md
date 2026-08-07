# Lumina Enterprise — BCOS UI/UX Design System

**Version:** 2.0.0  
**Design System Name:** Lumina Enterprise  
**Target Audience:** Frontend Engineers, UI/UX Designers, AI Engineers  
**Guiding Principle:** Lumina Enterprise is engineered for deep-focus enterprise intelligence. It employs a **Glassmorphic** aesthetic layered over a **Minimalist** foundation, prioritizing high data density without visual clutter. The interface feels like a sophisticated cockpit: dark, immersive, and precise.

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

### 6. Interactive Neo4j Knowledge Graph (`/graph`)
A 2D/3D canvas force-directed graph renderer visualizing 313 nodes and 266 directional cross-reference links connecting business departments, modules, and principles.

![Knowledge Graph Preview](assets/screens/knowledge_graph.png)

---

## 🎨 Brand & Style Guidelines

The core style relies on translucent layers (`white/[0.03]` with `24px` backdrop blur), subtle refractive borders (`white/5`), and **Primary Indigo** (`#b8c4ff`) accents that appear to emit light against the deep space backdrop (`#0c1324`). This creates a clear hierarchy of information through perceived depth rather than heavy color blocking.

---

## 📐 Color Palette Tokens (Lumina Enterprise)

### Surface & Background Tokens
| Token | Hex | Role / Usage |
|---|---|---|
| `surface` / `background` | `#0c1324` | Primary viewport background |
| `surface-container-lowest` | `#070d1f` | Deepest layer / inset containers |
| `surface-container-low` | `#151b2d` | Sidebar navigation, secondary containers |
| `surface-container` | `#191f31` | Card containers, modal backdrops |
| `surface-container-high` | `#23293c` | Input backgrounds, dropdowns |
| `surface-container-highest` | `#2e3447` | Elevating popovers, pill badges |
| `surface-bright` | `#33394c` | Highlighted borders & hover overlays |
| `on-surface` | `#dce1fb` | Primary body text |
| `on-surface-variant` | `#c4c5d6` | Muted labels, icons, subtitles |

### Brand & Primary Accent Tokens
| Token | Hex | Role / Usage |
|---|---|---|
| `primary` / `surface-tint` | `#b8c4ff` | Interactive states, primary actions, focused glow |
| `on-primary` | `#002585` | High-contrast text on primary buttons |
| `primary-container` | `#6b89ff` | Active tab containers, primary focus fills |
| `on-primary-container` | `#001f75` | Text on active container fills |
| `secondary` | `#bec6e0` | Secondary buttons, category chips |
| `tertiary` | `#ffb77d` | Accent tags, warn state highlights |

### Semantic Rule Colors
| Context | Color / Class | Border Indicator | Usage |
|---|---|---|---|
| **Always (Rule)** | `#10b981` Emerald | `border-l-4 border-l-[#10b981]` | Mandatory operational directives |
| **Never (Rule)** | `#ffb4ab` Error Red | `border-l-4 border-l-error` | Prohibited actions & anti-patterns |
| **Avoid (Rule)** | `#ffb77d` Tertiary Amber | `border-l-4 border-l-tertiary` | Cautionary guidelines & friction risks |
| **Prefer (Rule)** | `#b8c4ff` Primary Indigo | `border-l-4 border-l-primary` | Recommended default practices |

---

## 🔤 Typography Specification

Information density is maintained by a slightly reduced base font size (14px) and tight line-heights.

### Font Scale (Tailwind Configuration)
| Class Name | Font Family | Size | Line Height | Weight / Tracking | Usage |
|---|---|---|---|---|---|
| `display-lg` | Inter | 32px | 40px | Bold (700) / `-0.02em` | Page Title, Brand Headers |
| `headline-md` | Inter | 20px | 28px | SemiBold (600) / `-0.01em` | Section Titles, Card Headers |
| `body-base` | Inter | 14px | 20px | Regular (400) | Primary Body Text |
| `body-sm` | Inter | 12px | 16px | Regular (400) | Captions, Metadata |
| `mono-label` | JetBrains Mono | 11px | 14px | Medium (500) / `0.05em` UPPERCASE | Department Tags, Badges |
| `data-point` | JetBrains Mono | 13px | 16px | SemiBold (600) | Numeric Metrics, Counters |

---

## 📏 Shapes, Radius & Spacing Grid

- **Vertical Rhythm:** 4px baseline unit (`unit: 4px`). High-density components use 8px (`density-tight`).
- **Margins & Gutters:** Desktop side margins locked at `24px` (`margin: 24px`), gutters at `16px` (`gutter: 16px`).
- **Border Radii:**
  - Standard Cards / Inputs: `4px` (`rounded`)
  - Floating Panels: `8px` (`rounded-lg` / `rounded-xl`)
  - Department Pills: Fully rounded (`rounded-full`)

---

## 💫 Elevation & Depth Levels

1. **Level 0 (Base):** Deep Space background (`#0c1324`).
2. **Level 1 (Navigation Sidebar):** `#151b2d` with 1px `white/5` right border.
3. **Level 2 (Glass Cards):** Frosted glass (`white/[0.03]`) with `backdrop-blur-xl`.
4. **Level 3 (Popovers/Modals):** Frosted glass with `white/[0.08]` inner glow and `0 20px 50px rgba(0,0,0,0.5)` drop shadow.
