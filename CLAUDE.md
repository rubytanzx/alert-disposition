# Frontend Design System

This project uses **Next.js**, **Tailwind CSS v4**, and **shadcn/ui**.

---

## Component rules

Always use existing shadcn/ui components from `@/components/ui` before creating custom UI.

| Need | Use |
|---|---|
| Button | `@/components/ui/button` |
| Text input | `@/components/ui/input` |
| Textarea | `@/components/ui/textarea` |
| Select / dropdown | `@/components/ui/select` |
| Modal / overlay | `@/components/ui/dialog` |
| Contextual menu | `@/components/ui/dropdown-menu` |
| Side panel | `@/components/ui/sheet` |
| Tabs | `@/components/ui/tabs` |
| Tooltip | `@/components/ui/tooltip` |
| Badge / tag | `@/components/ui/badge` |
| Data table | `@/components/ui/table` |
| Search palette | `@/components/ui/command` |
| Card / panel | `@/components/ui/card` |
| Avatar | `@/components/ui/avatar` |
| Progress bar | `@/components/ui/progress` |
| Divider | `@/components/ui/separator` |

Do **not** recreate shadcn components using raw HTML elements.

Before creating a new component:
1. Check whether an equivalent shadcn primitive exists above.
2. Check `components/` for existing application-level components.
3. Only create a new primitive if neither exists.

---

## Typography

Use typography components from `@/components/ui/typography`.

```tsx
import { H1, H2, H3, H4, Body, Small, Muted, Label, Code } from "@/components/ui/typography"
```

| Component | Usage |
|---|---|
| `<H1>` | Page titles |
| `<H2>` | Section headings |
| `<H3>` | Sub-section headings |
| `<H4>` | Card titles / sub-headings |
| `<Body>` | Default body text |
| `<Small>` | Secondary body text |
| `<Muted>` | Dimmed / helper text |
| `<Label>` | Field labels, stat labels |
| `<Code>` | Inline code |

Do **not** invent arbitrary type sizes:
```tsx
// bad
<h1 className="text-[38px] font-bold leading-[42px]">Title</h1>

// good
<H1>Title</H1>
```

---

## Styling

Use Tailwind utilities with design tokens. Prefer semantic color tokens over raw values.

**Use:**
```
bg-background        text-foreground
bg-muted             text-muted-foreground
bg-primary           text-primary-foreground
bg-secondary         text-secondary-foreground
bg-accent            text-accent-foreground
bg-destructive       text-destructive-foreground
border-border        ring-ring
```

**Avoid:**
```
bg-[#FFFFFF]         text-[#242424]
bg-white             text-black  (unless intentional contrast override)
```

Do not introduce arbitrary hex colors unless explicitly requested.

---

## Layout

Default page container:
```tsx
<div className="max-w-7xl mx-auto px-6 lg:px-8">
```

Use Tailwind's spacing scale consistently. Avoid arbitrary spacing:
```tsx
// bad
<div className="mt-[13px] gap-[17px]">

// good
<div className="mt-3 gap-4">
```

---

## Icons

Use **Lucide React** icons:
```tsx
import { Bell, ShieldAlert, CheckCircle } from "lucide-react"
```

Size conventions:
- `h-4 w-4` — inline / button icons
- `h-5 w-5` — nav / standalone icons
- `h-6 w-6` — feature / section icons

---

## General UI generation rules

- Maintain visual consistency with the existing application.
- Use `cn()` from `@/lib/utils` for conditional classnames.
- Wrap tooltips correctly — `TooltipProvider` is already in `app/layout.tsx`.
- When building a new page/screen, prompt with: **"Use our existing design system. Prefer shadcn components and existing application components. Do not introduce new colors, type sizes, radii, or primitives unless necessary."**
