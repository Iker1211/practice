/**
 * Tailwind Integration Guide
 * 
 * Cómo los Design Tokens se integran con Tailwind CSS
 */

# Tailwind CSS Integration

## Overview

El proyecto usa Design Tokens que se mapean a CSS variables.
Tailwind consume esas CSS variables automáticamente.

```
tokens.ts (TypeScript)
    ↓
CSS variables (index.css)
    ↓
Tailwind config (referencias CSS variables)
    ↓
Componentes (use classes normalmente)
```

## Architecture

### 1. Design Tokens Define Values
**File:** `packages/ui/src/design/tokens.ts`

```typescript
export const COLORS = {
  light: {
    primary: 'hsl(249 95% 66%)',
    // ...
  }
}
```

⚠️ **Note:** Los tokens son valores de REFERENCIA, no los valores reales.

### 2. CSS Variables Define Real Values
**File:** `apps/mobile/src/index.css` (+ `apps/web`, `apps/desktop`)

```css
:root {
  --primary: 249, 95%, 66%;
  --background: 0 0% 100%;
  /* ... */
}

.dark {
  --primary: 210, 40%, 98%;
  --background: 222.2 84% 4.9%;
  /* ... */
}
```

✅ **Estos son los valores reales en el DOM**

### 3. Tailwind Config Consumes CSS Variables
**File:** `packages/tailwind-config/web.ts`

```typescript
const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",        // ← References CSS var
        background: "hsl(var(--background))",  // ← References CSS var
        // ...
      },
    },
  },
}
```

✅ **Tailwind classes automáticamente usan CSS variables** 

### 4. Components Use Tailwind Classes
```jsx
<button className="bg-primary text-white">
  // Resolves to: background-color: hsl(var(--primary))
  // Which evaluates to: hsl(249, 95%, 66%)
</button>
```

## Why This Architecture?

### ✅ Benefits

1. **Single Source of Truth**
   - Change CSS variable → all components update
   - No need to rebuild Tailwind config

2. **TypeScript Documentation**
   - tokens.ts documents what colors exist
   - IDE autocompletion for developers

3. **Dark Mode Native**
   - Change CSS variables in `.dark` class
   - All components adapt automatically
   - No JavaScript needed

4. **Multi-Platform Consistency**
   - Mobile, Web, Desktop can have different CSS values
   - But same Tailwind classes everywhere
   - Different look if needed, same code

5. **Performance**
   - CSS variables are zero-cost
   - No JavaScript overhead
   - Works in all modern browsers

6. **Flexibility**
   - Change colors without rebuilding
   - Add new theme via CSS only
   - Runtime theme switching possible

## How It Works in Practice

### Adding a New Color

1. **Update CSS Variables** (in `index.css`)
   ```css
   :root {
     --my-custom-color: 120, 100%, 60%;
   }
   ```

2. **Add to Tailwind Config** (in `tailwind-config/web.ts`)
   ```typescript
   colors: {
     myCustom: "hsl(var(--my-custom-color))",
   }
   ```

3. **Document in tokens.ts** (optional, for reference)
   ```typescript
   export const COLORS = {
     light: {
       myCustom: 'hsl(120 100% 60%)',
     }
   }
   ```

4. **Use in Components**
   ```jsx
   <div className="bg-myCustom">Works immediately!</div>
   ```

### Changing a Color Value

1. **Edit CSS Variable**
   ```css
   :root {
     --primary: 240, 100%, 50%;  // was: 249, 95%, 66%
   }
   ```

2. **No other changes needed!**
   - Tailwind config: ✓ Already references variable
   - Components: ✓ Already use classes
   - Everything updates automatically

### Dark Mode

```css
:root {
  --primary: 249, 95%, 66%;    /* Light mode: blue */
}

.dark {
  --primary: 210, 40%, 98%;    /* Dark mode: light */
}
```

```jsx
<button className="bg-primary">
  {/* Light mode: blue background */}
  {/* Dark mode: light background */}
  {/* No code changes needed! */}
</button>
```

## CSS Variable Format

### HSL Format (Used in Project)

```css
--color-name: H, S%, L%;
```

**Why HSL?**
- ✅ Easy to adjust (change S or L without changing hue)
- ✅ Natural for light/dark mode (just adjust L)
- ✅ Works in Tailwind: `hsl(var(--name))`
- ✅ All browsers support it

**Example:**
```css
--primary: 249, 95%, 66%;
/* Hue: 249° (purple-ish)
   Saturation: 95% (very vibrant)
   Lightness: 66% (bright) */
```

**In Tailwind:**
```typescript
primary: "hsl(var(--primary))"
// Becomes: hsl(249, 95%, 66%)
```

## Tailwind Config Details

### Current Setup

**File:** `packages/tailwind-config/web.ts`

```typescript
colors: {
  border: "hsl(var(--border))",          // Borders
  input: "hsl(var(--input))",            // Input fields
  ring: "hsl(var(--ring))",              // Focus rings
  background: "hsl(var(--background))",  // Page background
  foreground: "hsl(var(--foreground))",  // Text color
  
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  
  // ... more colors
}
```

### Corresponding CSS (index.css)

```css
:root {
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 249, 95%, 66%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}
```

## Using in Components

### Correct ✅

```jsx
import { Button } from '@myapp/ui'

export function MyComponent() {
  return (
    <>
      {/* Use Tailwind classes - they reference CSS variables */}
      <Button className="bg-primary text-white">
        Click me
      </Button>
      
      <div className="bg-background text-foreground">
        Text on background
      </div>
      
      <input className="border border-input rounded-md" />
    </>
  )
}
```

### Reference Tokens (when needed) ✅

```jsx
import { SPACING, TYPOGRAPHY } from '@myapp/ui'

export function MyComponent() {
  // Use tokens for hardcoded values in JavaScript
  const padding = SPACING.md
  const fontSize = TYPOGRAPHY.fontSize.base.size
  
  return (
    <div style={{ padding, fontSize }}>
      Content
    </div>
  )
}
```

### Wrong ❌

```jsx
// Don't import COLORS and try to use as hex values
import { COLORS } from '@myapp/ui'

const myColor = COLORS.light.primary  // 'hsl(249 95% 66%)'
// This is just documentation, real value comes from CSS variable

// Correct approach: use Tailwind class
<div className="bg-primary">  // ✓ Correct
```

## Theming Strategy

### Light/Dark Mode (Current)

CSS variables automatically switch:
```css
:root { --primary: blue; }
.dark { --primary: light; }
```

### Custom Theme (Future)

Add data attribute:
```html
<html data-theme="pink">
</html>
```

```css
[data-theme="pink"] {
  --primary: pink;
  --secondary: lightpink;
}
```

Add to Tailwind:
```typescript
// Already works with CSS variables
// No Tailwind config changes needed!
```

## Maintenance Checklist

- [ ] tokens.ts documents available colors
- [ ] CSS variables defined in index.css (light + .dark)
- [ ] Tailwind config references CSS variables (not hardcoded)
- [ ] Components use Tailwind classes (not inline styles)
- [ ] Dark mode selector is `.dark` class (Tailwind default)
- [ ] No hardcoded hex colors in components
- [ ] Design changes only require CSS variable updates

## Performance Impact

| Operation | Overhead |
|---|---|
| CSS variables | 0ms (native CSS) |
| Tailwind classes | 0ms (precompiled CSS) |
| Dark mode switch | ~1ms (CSS parse) |
| Theme change | ~10ms (browser paint) |

**Result:** No measurable performance impact. Pure CSS solution.

## Browser Support

CSS variables work in:
- ✅ Chrome 49+
- ✅ Firefox 31+
- ✅ Safari 9.1+
- ✅ Edge 15+
- ✅ All modern mobile browsers

**Fallback for IE11:** Not supported (OK for this project)

---

**TL;DR:**
1. Design tokens document available colors
2. CSS variables provide actual values
3. Tailwind config references CSS variables
4. Components use Tailwind classes
5. Changing one CSS variable updates everything
6. Dark mode is native and automatic
