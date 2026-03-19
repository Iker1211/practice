/**
 * Design System Usage Guide
 * 
 * Documentación de cómo usar los tokens en el proyecto
 */

/**
 * 1. IMPORTAR TOKENS
 * ===================
 */

// En cualquier componente o app:
import { 
  COLORS, 
  SPACING, 
  TYPOGRAPHY, 
  ANIMATIONS,
  BORDER_RADIUS,
  SHADOWS,
  DESIGN_SYSTEM
} from '@myapp/ui'

/**
 * 2. USAR EN TAILWIND CLASSNAMES
 * ===============================
 */

// Los tokens se mapean automáticamente a clases Tailwind via CSS variables:

// Colores (via Tailwind)
'bg-primary'              // → background-color: hsl(var(--primary))
'text-foreground'         // → color: hsl(var(--foreground))
'border-border'           // → border-color: hsl(var(--border))
'bg-destructive'          // → background-color: hsl(var(--destructive))
'text-muted-foreground'   // → color: hsl(var(--muted-foreground))

// Espaciado (Tailwind)
'p-md'                    // → padding: 1rem (16px)
'gap-lg'                  // → gap: 1.5rem (24px)
'mb-xl'                   // → margin-bottom: 2rem (32px)

// Border radius (via CSS variables)
'rounded-md'              // → border-radius: calc(var(--radius) - 2px)
'rounded-lg'              // → border-radius: var(--radius) - DEFAULT

// Sombras
'shadow-md'               // → box-shadow: [Tailwind shadow]
'shadow-lg'               // → box-shadow: [Tailwind shadow]

/**
 * 3. USAR EN COMPONENTES (hardcoded refs)
 * ========================================
 */

// Si necesitas valores específicos en código TypeScript/JavaScript:

import { SPACING, TYPOGRAPHY } from '@myapp/ui'

const padding = SPACING.md           // "1rem"
const fontSize = TYPOGRAPHY.fontSize.lg.size   // "1.125rem"
const fontWeight = TYPOGRAPHY.fontWeight.semibold  // "600"

// Ejemplo de uso:
const styles = {
  padding: SPACING.lg,               // "1.5rem"
  marginBottom: SPACING.md,          // "1rem"
  fontSize: TYPOGRAPHY.fontSize.base.size,  // "1rem"
  fontWeight: TYPOGRAPHY.fontWeight.bold,   // "700"
  fontFamily: TYPOGRAPHY.fontFamily.body,
}

/**
 * 4. DARK MODE
 * ============
 */

// El sistema soporta dark mode automáticamente
// CSS variables se cambian en .dark class

// En tailwind:
'dark:bg-primary'         // Aplica en .dark
'dark:text-foreground'

// En CSS:
// :root { --primary: ... }
// .dark { --primary: ... }

/**
 * 5. ANIMACIONES
 * ==============
 */

import { ANIMATIONS } from '@myapp/ui'

// Duraciones
ANIMATIONS.duration.fast       // "150ms"
ANIMATIONS.duration.normal     // "300ms"
ANIMATIONS.duration.slow       // "500ms"

// Easing
ANIMATIONS.easing['ease-in-out']    // "ease-in-out"
ANIMATIONS.easing['ease-cubic-out'] // Complex easing

// Presets (keyframes incluidos)
ANIMATIONS.preset['fade-in']
ANIMATIONS.preset['slide-in-right']
ANIMATIONS.preset['scale-in']

// Usar en Tailwind (si tenemos custom animations):
'animate-in'       // De tailwindcss-animate
'fade-in'          // Si agregamos custom keyframes

/**
 * 6. EJEMPLO COMPLETO: Componente FormField
 * ============================================
 */

// packages/ui/src/auth/FormField.tsx

import { SPACING, TYPOGRAPHY } from '@myapp/ui'
import { Input } from '../primitives/input'

interface FormFieldProps {
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  placeholder?: string
  disabled?: boolean
}

export function FormField({ 
  label, 
  error,
  ...props 
}: FormFieldProps) {
  return (
    <div className={`space-y-${SPACING.sm}`}>  // gap usando token
      <label className="text-sm font-medium">
        {label}
      </label>
      <Input
        {...props}
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-xs text-destructive animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * 7. TOKENS DISPONIBLES (Quick Reference)
 * ========================================
 */

// COLORS
COLORS.light            // Light mode colors
COLORS.dark             // Dark mode colors
COLORS.alias            // Semantic color aliases

// SPACING
SPACING['xs']  // 0.25rem (4px)
SPACING['sm']  // 0.5rem (8px)
SPACING['md']  // 1rem (16px)
SPACING['lg']  // 1.5rem (24px)
SPACING['xl']  // 2rem (32px)

// TYPOGRAPHY
TYPOGRAPHY.fontFamily.sans      // System sans-serif
TYPOGRAPHY.fontFamily.mono      // Monospace
TYPOGRAPHY.fontSize.base        // 1rem with line-height
TYPOGRAPHY.fontWeight.bold      // 700
TYPOGRAPHY.lineHeight.normal    // 1.5

// ANIMATIONS
ANIMATIONS.duration.fast        // 150ms
ANIMATIONS.duration.normal      // 300ms
ANIMATIONS.easing['ease-out']   // "ease-out"

// BORDER_RADIUS
BORDER_RADIUS.sm               // Slight rounding
BORDER_RADIUS.md               // Medium rounding
BORDER_RADIUS.lg               // Default rounding
BORDER_RADIUS.full             // Full radius (pills)

// SHADOWS
SHADOWS.sm                      // Subtle shadow
SHADOWS.md                      // Medium shadow
SHADOWS.lg                      // Prominent shadow

/**
 * 8. WORKFLOW: AGREGAR NUEVO TOKEN
 * ==================================
 */

// Si necesitas agregar un nuevo token (ej: nueva duración de animación):

// 1. Edita packages/ui/src/design/tokens.ts
// 2. Agrega el token a la sección correspondiente
// 3. Actualiza el export en packages/ui/src/design/index.ts
// 4. Usar inmediatamente en componentes

/*
export const ANIMATIONS = {
  duration: {
    fastest: '100ms',
    fast: '150ms',
    my_custom_duration: '250ms',  // ← NUEVO TOKEN
    normal: '300ms',
  },
}
*/

// 5. En componentes:
// import { ANIMATIONS } from '@myapp/ui'
// const myDuration = ANIMATIONS.duration.my_custom_duration

/**
 * 9. NOTAS IMPORTANTES
 * ====================
 */

/*
1. CSS VARIABLES vs Tokens:
   - Tokens en tokens.ts = Documentación + valores de referencia
   - CSS variables en index.css = Valores reales en el DOM
   - Tailwind lee CSS variables = Todo vinculado

2. DARK MODE:
   - Cambia automáticamente con .dark class
   - No necesitas verificar modo en componentes
   - Usa clases Tailwind como 'dark:bg-primary'

3. TIPADO:
   - Todos los tokens están tipados (TypeScript)
   - IDE autocompletion funciona
   - Catch errors en compile-time, no runtime

4. PERFORMANCE:
   - CSS variables = zero runtime cost
   - Tailwind classes = compiladas a CSS
   - Todo es static, sin JS overhead

5. ESCALABILIDAD:
   - Agregar nuevo color = 1 línea en COLORS
   - Agregar nuevo spacing = 1 línea en SPACING
   - No necesitas actualizar Tailwind config (usa CSS variables)
*/

/**
 * 10. PRÓXIMOS PASOS (Fase 2)
 * =============================
 */

/*
Con los tokens en lugar, próximas fases:

- Fase 2: Crear componentes compuestos de auth
  - Usar estos tokens en FormField, PasswordStrengthIndicator, etc
  - Los componentes son agnósticos a los valores específicos
  - Solo referencian tokens

- Fase 3: Refactor screens
  - LoginScreen/SignupScreen usan componentes de Fase 2
  - Heredan automáticamente todos los tokens

- Resultado: Un cambio de diseño = modificar tokens.ts
*/
