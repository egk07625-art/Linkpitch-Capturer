Here is the **English version** of the **LinkPitch Design Guide v1.0**.

This document is crafted to be directly usable by Cursor (or any developer), providing precise Tailwind classes, component structures, and animation presets that align with your "Silent Luxury" and "Performance First" philosophy.

---

# LinkPitch Design Guide v1.0
**Silent Luxury Meets Performance First**

> "A streamlined tool for professionals."
> This guide is designed for immediate implementation in a **Next.js 15 + Tailwind CSS + Shadcn/UI** environment.

---

## 📐 Design Philosophy

### Core Principles
1.  **Sharp & Technical** - Not cute; precise and edgy.
2.  **High Density** - Maximum information visible on one screen.
3.  **Snappy Interaction** - All responses within 0.2s.
4.  **Subtle Borders Over Shadows** - define structure with lines, not surfaces.

### Anti-Patterns (Strictly Forbidden)
- ❌ Bouncy spring animations.
- ❌ Heavy drop shadows.
- ❌ Gradient backgrounds.
- ❌ Card-based layouts (specifically in CRM tables).
- ❌ Transitions longer than 200ms.

---

## 🎨 Color System

### Base Colors (Tailwind Classes)
```css
/* Background Layers */
--bg-primary: zinc-950      /* #09090b - Main Background */
--bg-secondary: zinc-900    /* #18181b - Cards/Sidebar */
--bg-tertiary: zinc-800     /* #27272a - Hover State */

/* Borders */
--border-default: zinc-800  /* #27272a - Standard Border */
--border-subtle: zinc-700   /* #3f3f46 - Subtle Border */

/* Text */
--text-primary: zinc-50     /* #fafafa - Headings */
--text-secondary: zinc-400  /* #a1a1aa - Body Text */
--text-tertiary: zinc-500   /* #71717a - Inactive/Meta */

/* Interactive */
--interactive: amber-500   /* #f59e0b - Primary Action (Gold) */
--interactive-hover: amber-400
--destructive: rose-500     /* #f43f5e - Alert/Delete */
```

### Semantic Colors
| Context | Color | Usage |
| :--- | :--- | :--- |
| **CRM: Hot Lead** | `bg-rose-500/10 text-rose-500` | 🔥 Hot Badge |
| **CRM: Warm** | `bg-amber-500/10 text-amber-500` | 🔶 Warm Badge |
| **CRM: Cold** | `bg-zinc-700 text-zinc-400` | ❄️ Cold Badge |
| **Success State** | `bg-emerald-500/10 text-emerald-500` | ✓ Copied |
| **Core Step (1,3,6,9)** | `text-amber-400 border-l-2 border-amber-500` | Emphasis Highlight |

---

## 🔤 Typography

### Font Stack
```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Terminal Specific */
.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}
```

### Scale (Tailwind Classes)
```tsx
// Page Title
<h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>

// Section Header
<h2 className="text-lg font-medium text-zinc-50">Strategy Console</h2>

// Card Title
<h3 className="text-sm font-medium text-zinc-200">Step 1: Hook</h3>

// Body Text (Default)
<p className="text-sm text-zinc-400">Description text goes here.</p>

// Caption/Label
<span className="text-xs text-zinc-500">Last viewed</span>

// Terminal
<code className="font-mono text-xs text-emerald-400">&gt; Analyzing...</code>
```

### Line Height Rules
-   **Text Blocks**: `leading-relaxed` (1.625)
-   **UI Labels**: `leading-none` (1)
-   **Table Cells**: `leading-tight` (1.25)

---

## 📦 Component Patterns

### 1. Buttons

#### Primary Action
```tsx
<button className="
  bg-amber-500 hover:bg-amber-400 
  text-white font-medium
  px-4 py-2 rounded-sm
  transition-colors duration-150
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Generate Sequence
</button>
```

#### Secondary Action
```tsx
<button className="
  border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800
  text-zinc-200 font-medium
  px-4 py-2 rounded-sm
  transition-all duration-150
">
  Cancel
</button>
```

#### Destructive
```tsx
<button className="
  bg-rose-500/10 hover:bg-rose-500/20 
  border border-rose-500/50
  text-rose-500 font-medium
  px-3 py-1.5 rounded-sm text-sm
">
  Delete
</button>
```

#### Ghost (Icon Only)
```tsx
<button className="
  p-2 rounded-sm
  text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800
  transition-all duration-150
">
  <IconTrash size={16} />
</button>
```

### 2. Input Fields

#### Text Input (Minimal Border-Bottom Style)
```tsx
<input 
  type="text"
  placeholder="Enter company URL..."
  className="
    w-full bg-transparent 
    border-0 border-b border-zinc-700 
    focus:border-amber-500 focus:outline-none
    text-zinc-50 placeholder:text-zinc-600
    py-2 text-sm
    transition-colors duration-150
  "
/>
```

#### Textarea (Custom Context)
```tsx
<textarea 
  placeholder="Enter your strengths here..."
  className="
    w-full bg-zinc-900 
    border border-zinc-800 rounded-sm
    focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50
    text-zinc-50 placeholder:text-zinc-600
    p-3 text-sm min-h-[120px]
    resize-none
    transition-all duration-150
  "
/>
```

### 3. Cards

#### Base Card (Step Card)
```tsx
<div className="
  bg-zinc-900 border border-zinc-800 rounded-sm
  p-4
  hover:border-zinc-700
  transition-colors duration-150
">
  {/* Content */}
</div>
```

#### Droppable Zone (Active State)
```tsx
<div className={cn(
  "border-2 border-dashed rounded-sm p-4 transition-all duration-150",
  isOver 
    ? "border-amber-500 bg-amber-500/5" 
    : "border-zinc-800"
)}>
  Drop Here
</div>
```

### 4. Badges

#### CRM Status Badge
```tsx
// Hot Lead
<span className="
  inline-flex items-center gap-1
  bg-rose-500/10 border border-rose-500/50
  text-rose-500 text-xs font-medium
  px-2 py-1 rounded-full
">
  🔥 Hot
</span>

// Warm
<span className="
  inline-flex items-center gap-1
  bg-amber-500/10 border border-amber-500/50
  text-amber-500 text-xs font-medium
  px-2 py-1 rounded-full
">
  🔶 Warm
</span>

// Cold
<span className="
  inline-flex items-center gap-1
  bg-zinc-800 border border-zinc-700
  text-zinc-400 text-xs font-medium
  px-2 py-1 rounded-full
">
  ❄️ Cold
</span>
```

#### Draggable Chip
```tsx
<div className={cn(
  "border border-zinc-700 rounded-full px-3 py-1 text-xs",
  "cursor-grab active:cursor-grabbing",
  "hover:border-zinc-600 hover:bg-zinc-800",
  "transition-all duration-150",
  isDragging && "opacity-50 scale-95"
)}>
  📷 Performance Graph
</div>
```

### 5. Tables (High Density CRM)

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-zinc-800">
      <th className="text-left text-zinc-400 font-medium py-3 px-4">
        Company
      </th>
      <th className="text-left text-zinc-400 font-medium py-3 px-4">
        Status
      </th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    <tr className="
      border-b border-zinc-800 
      hover:bg-zinc-900 
      transition-colors duration-150
    ">
      <td className="py-3 px-4 text-zinc-50">GlowUp</td>
      <td className="py-3 px-4">
        <span className="bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full text-xs">
          🔥 Hot
        </span>
      </td>
    </tr>
  </tbody>
</table>
```

---

## 🎬 Animation Patterns

### Timing Functions
```css
/* globals.css - Override Tailwind defaults */
* {
  --duration-snap: 150ms;
  --duration-standard: 200ms;
  --easing-sharp: cubic-bezier(0.4, 0, 0.2, 1); /* No bounce */
}
```

### Framer Motion Presets
```tsx
// Page Transition
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}
const pageTransition = { duration: 0.15, ease: [0.4, 0, 0.2, 1] }

// Card Hover
<motion.div
  whileHover={{ scale: 1.005, borderColor: 'rgb(63 63 70)' }}
  transition={{ duration: 0.15 }}
>

// Button Click
<motion.button
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
>

// List Item Stagger
const containerVariants = {
  animate: { transition: { staggerChildren: 0.03 } }
}
const itemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 }
}
```

### Terminal Typing Effect
```tsx
// AnalysisTerminal.tsx
const logs = [
  { text: '> Connecting...', delay: 500 },
  { text: '> Capturing screenshot...', delay: 2000 },
  // ...
]

{logs.map((log, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15, delay: log.delay / 1000 }}
    className="font-mono text-xs text-emerald-400"
  >
    {log.text}
  </motion.div>
))}
```