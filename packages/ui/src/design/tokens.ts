/**
 * Design System Tokens
 * 
 * Single source of truth para:
 * - Colores (HSL format, compatible con Tailwind + CSS variables)
 * - Espaciado (escala coherente)
 * - Tipografía (familias, tamaños, pesos)
 * - Animaciones (duraciones, easing)
 * - Border radius
 * 
 * IMPORTANTE: Estos tokens son variables tipadas que documentan
 * el sistema de diseño. El valor real viene de CSS variables
 * en los apps (index.css, globals.css, etc).
 * 
 * Uso:
 * import { COLORS, SPACING, TYPOGRAPHY } from '@myapp/ui'
 */

// ============================================================================
// COLORS - HSL Format (Referencia + Backward Compatibility)
// ============================================================================
// Los valores HSL reales están definidos en CSS variables (--primary, etc)
// Estos son documentación y referencias para cuando necesites valores hardcoded

export const COLORS = {
  // Light Mode (Default)
  light: {
    background: 'hsl(0 0% 100%)',           // White
    foreground: 'hsl(222.2 84% 4.9%)',      // Charcoal
    primary: 'hsl(249 95% 66%)',            // Vibrant Blue
    'primary-foreground': 'hsl(210 40% 98%)',
    secondary: 'hsl(210 40% 96.1%)',        // Light Gray
    'secondary-foreground': 'hsl(222.2 47.4% 11.2%)',
    accent: 'hsl(210 40% 96.1%)',           // Same as secondary
    'accent-foreground': 'hsl(222.2 47.4% 11.2%)',
    destructive: 'hsl(0 84.2% 60.2%)',      // Red
    'destructive-foreground': 'hsl(210 40% 98%)',
    muted: 'hsl(210 40% 96.1%)',            // Light Gray
    'muted-foreground': 'hsl(215.4 16.3% 46.9%)',
    border: 'hsl(214.3 31.8% 91.4%)',       // Light border
    input: 'hsl(214.3 31.8% 91.4%)',        // Input border
    ring: 'hsl(222.2 84% 4.9%)',            // Focus ring
    card: 'hsl(0 0% 100%)',                 // Card background
    'card-foreground': 'hsl(222.2 84% 4.9%)',
    popover: 'hsl(0 0% 100%)',
    'popover-foreground': 'hsl(222.2 84% 4.9%)',
  },

  // Dark Mode
  dark: {
    background: 'hsl(222.2 84% 4.9%)',      // Dark charcoal
    foreground: 'hsl(210 40% 98%)',         // Off-white
    primary: 'hsl(210 40% 98%)',            // Light for dark bg
    'primary-foreground': 'hsl(222.2 47.4% 11.2%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',    // Dark gray
    'secondary-foreground': 'hsl(210 40% 98%)',
    accent: 'hsl(217.2 32.6% 17.5%)',
    'accent-foreground': 'hsl(210 40% 98%)',
    destructive: 'hsl(0 84.2% 60.2%)',      // Red (same in both modes)
    'destructive-foreground': 'hsl(210 40% 98%)',
    muted: 'hsl(217.2 32.6% 17.5%)',        // Dark gray
    'muted-foreground': 'hsl(215 20.2% 65.1%)',
    border: 'hsl(217.2 32.6% 17.5%)',
    input: 'hsl(217.2 32.6% 17.5%)',
    ring: 'hsl(212.7 26.8% 83.9%)',
    card: 'hsl(222.2 84% 4.9%)',
    'card-foreground': 'hsl(210 40% 98%)',
    popover: 'hsl(222.2 84% 4.9%)',
    'popover-foreground': 'hsl(210 40% 98%)',
  },

  // Semantic Aliases (para uses en código)
  // Estos usan CSS variables, no hardcoded values
  alias: {
    primary: 'var(--primary)',
    'primary-foreground': 'var(--primary-foreground)',
    secondary: 'var(--secondary)',
    'secondary-foreground': 'var(--secondary-foreground)',
    success: 'var(--accent)',              // Reutilizar accent para success
    error: 'var(--destructive)',
    warning: 'var(--accent)',              // Reutilizar accent para warning
    info: 'var(--primary)',
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    muted: 'var(--muted)',
    'muted-foreground': 'var(--muted-foreground)',
    border: 'var(--border)',
    input: 'var(--input)',
    card: 'var(--card)',
    'card-foreground': 'var(--card-foreground)',
  },
} as const

// ============================================================================
// SPACING - Escala de espaciado
// ============================================================================
// Basado en escala 4px (quarter = 4px, half = 8px, etc)

export const SPACING = {
  // Micro
  '0': '0',
  'xs': '0.25rem',    // 4px
  'sm': '0.5rem',     // 8px
  'md': '1rem',       // 16px
  'lg': '1.5rem',     // 24px
  'xl': '2rem',       // 32px
  '2xl': '3rem',      // 48px
  '3xl': '4rem',      // 64px
  '4xl': '6rem',      // 96px

  // Aliases para fácil referencia
  gap: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  padding: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  margin: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
} as const

// ============================================================================
// TYPOGRAPHY - Sistema tipográfico
// ============================================================================

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    // Display: Títulos grandes, atractivos
    // Usa system fonts por defecto (cross-platform consistency)
    display: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',

    // Body: Texto regular, legibilidad
    body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',

    // Aliases para uso
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, "Cascadia Code", "Source Code Pro", Monaco, "Courier New", monospace',
  },

  // Font sizes - Escala modular (1.125 ratio)
  fontSize: {
    'xs': {
      size: '0.75rem',        // 12px
      lineHeight: '1rem',     // 16px
      letterSpacing: '0.5px',
    },
    'sm': {
      size: '0.875rem',       // 14px
      lineHeight: '1.25rem',  // 20px
      letterSpacing: '0.25px',
    },
    'base': {
      size: '1rem',           // 16px
      lineHeight: '1.5rem',   // 24px
      letterSpacing: '0',
    },
    'lg': {
      size: '1.125rem',       // 18px
      lineHeight: '1.75rem',  // 28px
      letterSpacing: '0',
    },
    'xl': {
      size: '1.25rem',        // 20px
      lineHeight: '1.75rem',  // 28px
      letterSpacing: '-0.5px',
    },
    '2xl': {
      size: '1.5rem',         // 24px
      lineHeight: '2rem',     // 32px
      letterSpacing: '-0.5px',
    },
    '3xl': {
      size: '1.875rem',       // 30px
      lineHeight: '2.25rem',  // 36px
      letterSpacing: '-1px',
    },
    '4xl': {
      size: '2.25rem',        // 36px
      lineHeight: '2.5rem',   // 40px
      letterSpacing: '-1.5px',
    },
    '5xl': {
      size: '3rem',           // 48px
      lineHeight: '1',
      letterSpacing: '-2px',
    },
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ============================================================================
// ANIMATIONS - Movimiento y transiciones
// ============================================================================

export const ANIMATIONS = {
  // Duraciones estándar
  duration: {
    fastest: '100ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Easing functions (CSS timing functions)
  easing: {
    'linear': 'linear',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'ease-quad-in': 'cubic-bezier(0.11, 0, 0.5, 0)',
    'ease-quad-out': 'cubic-bezier(0.5, 1, 0.89, 1)',
    'ease-cubic-in': 'cubic-bezier(0.32, 0, 0.67, 0)',
    'ease-cubic-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
    'ease-quart-in': 'cubic-bezier(0.5, 0, 0.75, 0)',
    'ease-quart-out': 'cubic-bezier(0.25, 1, 0.5, 1)',
  },

  // Preset combinations
  preset: {
    'fade-in': {
      animation: 'fadeIn 300ms ease-out',
      keyframes: {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
    },
    'slide-in-right': {
      animation: 'slideInRight 300ms ease-out',
      keyframes: {
        from: { transform: 'translateX(100%)' },
        to: { transform: 'translateX(0)' },
      },
    },
    'slide-in-left': {
      animation: 'slideInLeft 300ms ease-out',
      keyframes: {
        from: { transform: 'translateX(-100%)' },
        to: { transform: 'translateX(0)' },
      },
    },
    'scale-in': {
      animation: 'scaleIn 300ms ease-out',
      keyframes: {
        from: { transform: 'scale(0.95)', opacity: '0' },
        to: { transform: 'scale(1)', opacity: '1' },
      },
    },
    'pulse': {
      animation: 'pulse 2000ms cubic-bezier(0.4, 0, 0.6, 1) infinite',
      keyframes: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
    },
  },
} as const

// ============================================================================
// BORDER RADIUS - Redondeamiento de esquinas
// ============================================================================

export const BORDER_RADIUS = {
  'none': '0',
  'sm': 'calc(var(--radius) - 4px)',     // ~2px
  'md': 'calc(var(--radius) - 2px)',     // ~4px
  'lg': 'var(--radius)',                 // 8px (default)
  'xl': 'calc(var(--radius) + 4px)',     // ~12px
  '2xl': 'calc(var(--radius) + 8px)',    // ~16px
  '3xl': 'calc(var(--radius) + 12px)',   // ~20px
  'full': '9999px',
} as const

// ============================================================================
// SHADOWS - Profundidad y elevación
// ============================================================================

export const SHADOWS = {
  'none': 'none',
  'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'base': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const

// ============================================================================
// BREAKPOINTS - Responsive design
// ============================================================================

export const BREAKPOINTS = {
  'xs': '0px',      // Mobile
  'sm': '640px',    // Small devices
  'md': '768px',    // Tablets
  'lg': '1024px',   // Small desktops
  'xl': '1280px',   // Desktops
  '2xl': '1536px',  // Large desktops
} as const

// ============================================================================
// Z-INDEX - Stacking contexts
// ============================================================================

export const Z_INDEX = {
  'auto': 'auto',
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  'dropdown': '1000',
  'sticky': '1020',
  'fixed': '1030',
  'modal-backdrop': '1040',
  'modal': '1050',
  'popover': '1060',
  'tooltip': '1070',
} as const

// ============================================================================
// EXPORT: All tokens as a single object (convenience)
// ============================================================================

export const DESIGN_SYSTEM = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  animations: ANIMATIONS,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  breakpoints: BREAKPOINTS,
  zIndex: Z_INDEX,
} as const

// ============================================================================
// TYPES: Export types para TypeScript support
// ============================================================================

export type ColorKey = keyof typeof COLORS.light
export type SpacingKey = keyof typeof SPACING
export type FontSizeKey = keyof typeof TYPOGRAPHY.fontSize
export type FontWeightKey = keyof typeof TYPOGRAPHY.fontWeight
export type AnimationKey = keyof typeof ANIMATIONS.duration
export type BorderRadiusKey = keyof typeof BORDER_RADIUS
export type ShadowKey = keyof typeof SHADOWS
export type BreakpointKey = keyof typeof BREAKPOINTS
export type ZIndexKey = keyof typeof Z_INDEX
