/**
 * Design System Reference Card
 * 
 * Quick lookup para los tokens más comunes
 */

# Design System - Quick Reference

## Import

```typescript
import { 
  COLORS, SPACING, TYPOGRAPHY, ANIMATIONS, 
  BORDER_RADIUS, SHADOWS, DESIGN_SYSTEM 
} from '@myapp/ui'
```

## Colors (Tailwind Classes)

| Use Case | Tailwind Class | Value |
|---|---|---|
| Primary Button | `bg-primary text-white` | Blue (249° 95% 66%) |
| Secondary Button | `bg-secondary text-foreground` | Light Gray |
| Error/Destructive | `bg-destructive text-white` | Red |
| Muted Text | `text-muted-foreground` | Gray |
| Borders | `border border-border` | Light Gray |
| Cards | `bg-card text-card-foreground` | White → Dark in dark mode |
| Background | `bg-background text-foreground` | White → Charcoal in dark mode |

## Spacing (Tailwind Classes)

| Token | Value | Tailwind |
|---|---|---|
| `xs` | 4px | `p-xs`, `gap-xs`, `m-xs` |
| `sm` | 8px | `p-sm`, `gap-sm`, `m-sm` |
| `md` | 16px | `p-md`, `gap-md`, `m-md` |
| `lg` | 24px | `p-lg`, `gap-lg`, `m-lg` |
| `xl` | 32px | `p-xl`, `gap-xl`, `m-xl` |
| `2xl` | 48px | `p-2xl`, `gap-2xl`, `m-2xl` |

## Typography (Tailwind + Classes)

### Font Sizes
```
text-xs   → 12px
text-sm   → 14px
text-base → 16px (default)
text-lg   → 18px
text-xl   → 20px
text-2xl  → 24px
text-3xl  → 30px
text-4xl  → 36px
text-5xl  → 48px
```

### Font Weights
```
font-light      → 300
font-normal     → 400
font-medium     → 500
font-semibold   → 600
font-bold       → 700
font-extrabold  → 800
```

### Font Families (in code)
```typescript
TYPOGRAPHY.fontFamily.sans   // System sans-serif
TYPOGRAPHY.fontFamily.mono   // Monospace
```

## Animations (Durations & Easing)

### Durations
```typescript
ANIMATIONS.duration.fastest  → 100ms
ANIMATIONS.duration.fast     → 150ms
ANIMATIONS.duration.normal   → 300ms (default)
ANIMATIONS.duration.slow     → 500ms
ANIMATIONS.duration.slower   → 700ms
ANIMATIONS.duration.slowest  → 1000ms
```

### Easing
```typescript
ANIMATIONS.easing.linear
ANIMATIONS.easing['ease-in-out']
ANIMATIONS.easing['ease-cubic-out']
```

## Border Radius (Tailwind Classes)

```
rounded-sm   → calc(var(--radius) - 4px) ≈ 2px
rounded-md   → calc(var(--radius) - 2px) ≈ 4px
rounded-lg   → var(--radius) = 8px
rounded-xl   → calc(var(--radius) + 4px) ≈ 12px
rounded-2xl  → calc(var(--radius) + 8px) ≈ 16px
rounded-full → 9999px (pills)
```

## Shadows (Tailwind Classes)

```
shadow-sm    → Subtle
shadow-base  → Default
shadow-md    → Moderate
shadow-lg    → Prominent
shadow-xl    → Strong
shadow-2xl   → Very strong
```

## Common Component Patterns

### Form Field
```jsx
<div className="space-y-2">
  <label className="text-sm font-medium">Label</label>
  <Input className="..." />
  {error && <p className="text-xs text-destructive">{error}</p>}
</div>
```

### Button
```jsx
<button className="bg-primary text-white px-lg py-md rounded-md hover:bg-primary/90">
  Click me
</button>
```

### Card
```jsx
<div className="bg-card text-card-foreground rounded-lg border border-border shadow-md p-lg">
  Content
</div>
```

### Error Message
```jsx
<div className="bg-destructive/10 border border-destructive text-destructive text-sm p-md rounded-md">
  Error message
</div>
```

## Dark Mode

Tailwind automatically adapts:
```jsx
// Light mode: primary = blue
// Dark mode: primary = light gray
<button className="bg-primary">Works in both modes!</button>

// Override for dark mode:
<button className="bg-primary dark:bg-secondary">
  Different in dark mode
</button>
```

## TypeScript Types

```typescript
import type {
  ColorKey,
  SpacingKey,
  FontSizeKey,
  FontWeightKey,
  AnimationKey,
  BorderRadiusKey
} from '@myapp/ui'

const spacing: SpacingKey = 'md'  // ✓ OK
const spacing: SpacingKey = 'invalid'  // ✗ TypeScript error
```

## Figma → Code Mapping

| Figma | Code |
|---|---|
| 16px padding | `p-md` |
| 24px gap | `gap-lg` |
| Primary color text | `text-primary` |
| Small text | `text-sm` |
| 300ms animation | `duration-300` |

## When to Use Each

### Use Tailwind Classes
- ✅ Regular styling
- ✅ Layout & spacing
- ✅ Colors & backgrounds
- ✅ Quick changes

### Use Token Constants
- ✅ Hardcoded values in JS
- ✅ Dynamic styling
- ✅ Programmatic values
- ✅ Documentation

## Complete Example

```jsx
import { SPACING, TYPOGRAPHY } from '@myapp/ui'

export function LoginForm() {
  return (
    <div className="space-y-lg">
      {/* Text token usage */}
      <h1 
        className="text-3xl font-bold"
        style={{ fontFamily: TYPOGRAPHY.fontFamily.sans }}
      >
        Sign In
      </h1>

      {/* Form field with Tailwind */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input 
          className="w-full px-md py-sm border border-input rounded-md text-foreground"
          type="email"
          placeholder="you@example.com"
        />
      </div>

      {/* Button with animation */}
      <button 
        className="w-full bg-primary text-white px-lg py-md rounded-md hover:bg-primary/90 transition-colors duration-fast"
      >
        Sign In
      </button>
    </div>
  )
}
```

## Maintenance

### Adding a new token
1. Edit `packages/ui/src/design/tokens.ts`
2. Add to appropriate section (COLORS, SPACING, etc)
3. Update `packages/ui/src/design/index.ts` if needed
4. Use in components immediately (no Tailwind config changes needed!)

### Updating existing token
1. Edit `packages/ui/src/design/tokens.ts`
2. Rebuild project
3. Changes propagate everywhere (TypeScript + CSS variables)

### Creating theme variant
1. Add new CSS variables in `index.css`
2. Add to COLORS object for reference
3. Use `[class] dark:...` or `[data-theme="..."]` selectors

---

**Last Updated:** March 18, 2026  
**Design System Version:** 1.0 - Phase 1 Complete
