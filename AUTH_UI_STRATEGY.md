# UI for Auth Core - Análisis Arquitectónico & Plan de Desarrollo

**Fecha:** March 18, 2026  
**Proyecto:** Ideas Mobile  
**Objetivo:** Mejorar UI/UX de autenticación sin duplicación de código  
**Consideración:** Consecuencias de segundo orden (3+ plataformas: mobile, web, desktop)

---

## 🎉 STATUS: FASE 1-2 COMPLETADAS ✅

**Phase 1:** Design System Tokens ✅
**Phase 2:** Reusable Auth Components ✅

👉 **[Ver PHASE_1_SUMMARY.md](packages/ui/PHASE_1_SUMMARY.md)** para detalles de tokens
👉 **[Ver PHASE_2_SUMMARY.md](packages/ui/PHASE_2_SUMMARY.md)** para detalles de componentes

### Archivos Creados:
- ✅ `packages/ui/src/design/tokens.ts` - Tokens centralizados
- ✅ `packages/ui/src/design/index.ts` - Índice de exports
- ✅ `packages/ui/src/design/USAGE.md` - Guía de uso
- ✅ `packages/ui/src/design/REFERENCE.md` - Quick reference card
- ✅ `packages/ui/src/design/TAILWIND_INTEGRATION.md` - Integración con Tailwind
- ✅ `packages/ui/src/design/VERIFICATION.md` - Testing & verification

### Tokens Disponibles:
- ✅ **COLORS** - Light + Dark mode, semantic aliases
- ✅ **SPACING** - Escala 4-96px
- ✅ **TYPOGRAPHY** - Font families, sizes, weights
- ✅ **ANIMATIONS** - Durations, easing functions
- ✅ **BORDER_RADIUS** - Radius scales
- ✅ **SHADOWS** - Shadow elevation
- ✅ **BREAKPOINTS** - Responsive breakpoints
- ✅ **Z_INDEX** - Stacking context

### TypeScript Support:
- ✅ Types exportados: `ColorKey`, `SpacingKey`, `FontSizeKey`, etc.
- ✅ Autocompletion en IDE
- ✅ Type-safe token usage

---

## PARTE 1: ANÁLISIS DEL ESTADO ACTUAL

### Estructura Actual

```
packages/
  ui/
    src/
      button.tsx          ✅ Primitiva (CVA + TailwindCSS)
      card.tsx            ✅ Compuesta (Card + CardHeader + CardContent + etc)
      input.tsx           ✅ Primitiva
      index.ts            ✅ Exports centralizados
      

apps/
  mobile/
    src/
      screens/
        LoginScreen.tsx   ⚠️  Básica, sin diseño cohesivo
        SignupScreen.tsx  ⚠️  Básica, sin diseño cohesivo
      hooks/
        useAuthForm.ts    ✅ Validación centralizada
```

### Problemas Identificados

1. **Sin Componentes Compuestos de Auth**
   - LoginScreen y SignupScreen tienen lógica de formulario repetida
   - No hay componentes reutilizables como `FormField`, `PasswordStrengthIndicator`
   - Si cambias el diseño, modificas 2+ lugares

2. **Sin Sistema de Diseño Unificado**
   - No hay `tailwind.config.ts` centralizado
   - Colors, spacing, tipografía no son tokens compartidos
   - Cada app (mobile, web, desktop) usa sus propias variables

3. **Sin Estrategia Multi-Plataforma**
   - LoginScreen en mobile es diferente a web (por necesidad actual)
   - Si quieres mismo look en 3 plataformas, tienes duplicación de código
   - Consecuencia: bug fix en 1 lugar = 3 sitios a actualizar

4. **Sin Animaciones/UX Polish**
   - Screens son funcionales pero planas
   - No hay feedback visual (loading states, transitions)
   - Mobile apps esperan micro-interacciones

---

## PARTE 2: ARQUITECTURA PROPUESTA

### Opción A: Component-Driven (Recomendado)

**Filosofía:** "Single Source of Truth" para cada componente

```
packages/
  ui/
    src/
      ✅ PRIMITIVAS (ya existen)
      primitives/
        button.tsx
        card.tsx
        input.tsx
      
      ✨ NUEVAS: SYSTEM DESIGN
      design/
        colors.ts          (CSS variables + Tailwind tokens)
        typography.ts      (font families, sizes, weights)
        animations.ts      (keyframes reutilizables)
        spacing.ts         (size scales)
      
      ✨ NUEVAS: COMPONENTES COMPUESTOS
      auth/
        FormField.tsx          (Label + Input + Error message)
        PasswordStrengthIndicator.tsx
        AuthCard.tsx           (Card especializada para auth)
        LoginForm.tsx          (Login logic + UI)
        SignupForm.tsx         (Signup logic + UI)
        AuthLayout.tsx         (Background + container común)
      
      index.ts
```

**Ventajas:**
- ✅ Un cambio de diseño = 1 archivo
- ✅ Reutilizable en 3 plataformas (mobile, web, desktop)
- ✅ Tests centralizados (test 1 componente = works everywhere)
- ✅ DX excelente (importas lo que necesitas)
- ✅ Escalable (agregar OAuth = 1 componente nuevo)

**Desventajas:**
- Más trabajo inicial (setup)

### Opción B: Screen-Centric (No recomendado)

Dejar cada screen con su próprio componente local.

**Desventajas de segundo orden:** 
- 🔴 Duplicación de código
- 🔴 Bugs en 3 lugares
- 🔴 Difícil de escalar (adding OAuth = 3 componentes)
- 🔴 No reutilizar en web/desktop

---

## PARTE 3: MEJOR APPROACH - "Design System First"

### Por Qué Esta Estrategia Es Mejor:

1. **Reduce Complejidad Futura**
   - Agrega OAuth → solo 1 componente nuevo
   - Agrega 2FA → 1 componente nuevo
   - Cambia diseño → 1-2 archivos

2. **Permite Reutilización Multi-Plataforma**
   - Mobile → web → desktop (mismo componentes, diferentes layouts)
   - Ejemplo: `LoginForm` funciona en todas

3. **Escalable Arquitectónicamente**
   - Sistema de tokens (colors, spacing) permite temas (dark/light)
   - Componentes compuestos = building blocks para crear más rápido
   - Fácil agregar nuevas features

4. **Mejor DX**
   - Developers nuevos entienden la estructura
   - "Dónde pongo el componente X?" → siempre la misma rispuesta
   - Storybook/Stories = documentación viva

5. **Impacto de Segundo Orden**
   - Hoy: 2 screens (login + signup)
   - Mañana: +password reset, +social auth, +2FA, +biometric
   - Con system: crece en "módulos", no en caos

---

## PARTE 4: PLAN DE IMPLEMENTACIÓN (PASO A PASO)

### FASE 1: Crear Sistema de Diseño ✅ COMPLETADA (2 horas)

**Status:** Done! Todos los tokens creados, documentados, y listos para usar.

#### Qué se creó:

**1. `packages/ui/src/design/tokens.ts`**
```typescript
export const COLORS = { /* light, dark, alias */ }
export const SPACING = { /* xs-4xl */ }
export const TYPOGRAPHY = { /* families, sizes, weights */ }
export const ANIMATIONS = { /* durations, easing, presets */ }
export const BORDER_RADIUS = { /* none-full */ }
export const SHADOWS = { /* sm-2xl */ }
export const BREAKPOINTS = { /* xs-2xl */ }
export const Z_INDEX = { /* auto-9999 */ }
```

**2. `packages/ui/src/design/USAGE.md`**
- Guía completa de cómo usar tokens
- Ejemplos en code
- Patrones comunes

**3. `packages/ui/src/design/REFERENCE.md`**
- Quick lookup card
- Tabla de todos los tokens
- Mapping Figma → Code

**4. `packages/ui/src/design/TAILWIND_INTEGRATION.md`**
- Architecture overview (tokens → CSS vars → Tailwind)
- Explicación del flujo
- Dark mode strategy

**5. `packages/ui/src/design/VERIFICATION.md`**
- Testing checklist
- Common issues & fixes
- Success criteria

#### Cómo usar ahora:
```typescript
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '@myapp/ui'

// En código:
const padding = SPACING.md           // "1rem"
const fontSize = TYPOGRAPHY.fontSize.lg.size  // "1.125rem"

// En HTML/JSX:
<div className="p-md bg-primary text-white rounded-lg">
  Usa Tailwind classes directamente
</div>
```

### FASE 2: Crear Componentes Compuestos de Auth (3 horas)

#### Paso 2.1: FormField (Reutilizable)

**Archivo:** `packages/ui/src/auth/FormField.tsx`

```typescript
import { ReactNode } from 'react'
import { Input } from '../primitives/input'

interface FormFieldProps {
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
}

export function FormField({ 
  label, 
  error, 
  ...props 
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input
        {...props}
        className={error ? 'border-error' : ''}
      />
      {error && (
        <p className="text-xs text-error animate-in fade-in">{error}</p>
      )}
    </div>
  )
}
```

**Uso en LoginScreen:**
```typescript
<FormField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  placeholder="tu@email.com"
/>
```

#### Paso 2.2: PasswordStrengthIndicator

**Archivo:** `packages/ui/src/auth/PasswordStrengthIndicator.tsx`

```typescript
interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculateStrength(password)
  
  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-1 h-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${
              i <= strength ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted">
        {strength === 1 && '⚠️ Débil'}
        {strength === 2 && '✓ Medio'}
        {strength === 3 && '✓✓ Fuerte'}
      </p>
    </div>
  )
}
```

#### Paso 2.3: AuthCard

**Archivo:** `packages/ui/src/auth/AuthCard.tsx`

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../primitives/card'

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

#### Paso 2.4: AuthLayout

**Archivo:** `packages/ui/src/auth/AuthLayout.tsx`

```typescript
interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen 
                    bg-gradient-to-br from-slate-900 to-slate-800 p-4 
                    animate-in fade-in">
      {children}
    </div>
  )
}
```

#### Paso 2.5: LoginForm & SignupForm

**Archivo:** `packages/ui/src/auth/LoginForm.tsx`

```typescript
import { useState } from 'react'
import { FormField } from './FormField'
import { Button } from '../primitives/button'
import { useAuthForm, mapSupabaseAuthErrorToMessage } from '@myapp/lib'

interface LoginFormProps {
  onSuccess: () => void
  onSignupClick: () => void
  onSubmit: (email: string, password: string) => Promise<void>
  loading?: boolean
  error?: string
}

export function LoginForm({ 
  onSuccess, 
  onSignupClick,
  onSubmit,
  loading,
  error: authError,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const { validateLogin, getErrorForField, clearErrors } = useAuthForm()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    setServerError(null)

    if (!validateLogin(email, password)) return

    try {
      await onSubmit(email.trim(), password)
      onSuccess()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={getErrorForField('email')}
        placeholder="tu@email.com"
        disabled={loading}
      />

      <FormField
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={getErrorForField('password')}
        placeholder="••••••••"
        disabled={loading}
      />

      {(serverError || authError) && (
        <div className="bg-error/10 border border-error text-error text-sm p-3 rounded">
          {serverError || mapSupabaseAuthErrorToMessage(authError?.code)}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Button>

      <div className="text-center text-sm text-muted space-y-2">
        <p>
          ¿No tienes cuenta?{' '}
          <button 
            onClick={onSignupClick}
            className="text-primary hover:underline font-medium"
          >
            Crear una aquí
          </button>
        </p>
      </div>
    </form>
  )
}
```

### FASE 3: Refactorizar Screens (1.5 horas)

#### Paso 3.1: Nueva LoginScreen (SIMPLE!)

**Archivo:** `apps/mobile/src/screens/LoginScreen.tsx`

```typescript
import { useAuth } from '@myapp/lib'
import { 
  AuthLayout, 
  AuthCard, 
  LoginForm 
} from '@myapp/ui'

export function LoginScreen({ 
  onLoginSuccess, 
  onSwitchToSignup 
}: LoginScreenProps) {
  const { signIn, loading, error } = useAuth()

  return (
    <AuthLayout>
      <AuthCard 
        title="Ideas App" 
        description="Inicia sesión para continuar"
      >
        <LoginForm
          onSuccess={onLoginSuccess}
          onSignupClick={onSwitchToSignup}
          onSubmit={(email, password) => signIn({ email, password })}
          loading={loading}
          error={error?.code}
        />
      </AuthCard>
    </AuthLayout>
  )
}
```

**Ventaja:** 15 líneas vs 100+ antes! 🎉

#### Paso 3.2: Nueva SignupScreen

Mismo patrón → 15-20 líneas

---

## PARTE 5: DONDE GUARDAR LOS COMPONEN ENTES

### Estructura Final

```
packages/
  ui/
    src/
      index.ts                          (exports centralizados)
      
      primitives/           ← No duplicar, reutilizar
        button.tsx
        card.tsx
        input.tsx
      
      design/               ← NEW: Sistema de diseño
        tokens.ts           (colors, spacing, typography)
        animations.ts       (keyframes)
      
      auth/                 ← NEW: Componentes de Auth
        index.ts
        FormField.tsx       (reutilizable)
        PasswordStrengthIndicator.tsx
        AuthCard.tsx        (Card especializada)
        AuthLayout.tsx      (Background + container)
        LoginForm.tsx       (Form completo)
        SignupForm.tsx      (Form completo)
        ForgotPasswordForm.tsx  (future)
      
      stories/              (Storybook para visualizar)
        auth/
          LoginForm.stories.tsx
          SignupForm.stories.tsx

apps/
  mobile/
    src/
      screens/              ← SIMPLE: Solo props + layout
        LoginScreen.tsx     (usa LoginForm de @myapp/ui)
        SignupScreen.tsx    (usa SignupForm de @myapp/ui)
      
  web/
    src/
      components/auth/      ← Puede importar desde @myapp/ui
        LoginPage.tsx       (usa LoginForm de @myapp/ui)
        SignupPage.tsx      (usa SignupForm de @myapp/ui)
      
  desktop/
    src/
      components/auth/      ← Puede importar desde @myapp/ui
        LoginWindow.tsx     (usa LoginForm de @myapp/ui)
        SignupWindow.tsx    (usa SignupForm de @myapp/ui)
```

---

## PARTE 6: COMO MIGRAR (Sin Romper)

### Estrategia: Gradual + CI/CD Safe

**Paso 0: Branch + Tests**
```bash
git checkout -b feature/auth-ui-system
npm run test                    # Asegura que todo funciona
```

**Paso 1: Crear Design Tokens (0 breaking changes)**
```
- Crear packages/ui/src/design/tokens.ts
- NO tocar Tailwind config aún
- COMMIT + TEST
```

**Paso 2: Crear Componentes Compuestos (0 breaking changes)**
```
- Crear packages/ui/src/auth/
- Exportar desde packages/ui/src/index.ts
- COMMIT + TEST
- Nadie lo usa aún → 100% backward compatible
```

**Paso 3: Refactorizar Screens (1 por 1)**
```
- Refactor LoginScreen.tsx
- TEST en dispositivo real
- Si ok → commit
- Si no → revert
- Refactor SignupScreen.tsx
- TEST
- COMMIT
```

**Paso 4: Cleanup** (después que todo funciona)
```
- Actualizar Tailwind config
- Limpiar CSS duplicado
- COMMIT
```

**Paso 5: Merge a Main**
```
git push origin feature/auth-ui-system
# Create PR
# Code review
# MERGE
```

---

## PARTE 7: IMPACTO DE SEGUNDO ORDEN

### Con Esta Arquitectura:

| Escenario | Impacto |
|-----------|--------|
| "Agregar OAuth" | 1 nuevo componente: `OAuthForm.tsx` |
| "Agregar 2FA" | 1 nuevo componente: `TwoFactorForm.tsx` |
| "Cambiar colores" | 1 archivo: `tokens.ts` |
| "Cambiar tipografía" | 1 archivo: `tokens.ts` |
| "Agregar dark mode" | 1 archivo: Tailwind config con `prefers-color-scheme` |
| "Llevar auth a web" | Importa `LoginForm` desde `@myapp/ui` |
| "Llevar auth a desktop" | Importa `LoginForm` desde `@myapp/ui` |
| "Documentar componentes" | 1 lugar: Storybook |
| "Hacer tests" | Tests en `packages/ui/` = funciona en 3 plataformas |

---

## RESUMEN: MEJOR APPROACH

### ✅ Recomendado: Design System First + Component-Driven

**Por qué:**
1. **Escalabilidad:** Agregar features = nuevo componente, no 6 archivos
2. **Reutilización:** Mobile = Web = Desktop (mismo componentes)
3. **Mantenibilidad:** Bug fix en 1 lugar
4. **DX:** Claro dónde va cada cosa
5. **Testing:** Tests centralizados

### 🚫 No Recomendado: Screen-Focused

**Por qué no:**
1. Duplicación (3 platforms = 3x código)
2. Mantenibilidad pesadilla
3. Escalabilidad terrible
4. No reutilizable

---

## RESUMEN: MEJOR APPROACH

### ✅ Recomendado: Design System First + Component-Driven

**Por qué:**
1. **Escalabilidad:** Agregar features = nuevo componente, no 6 archivos
2. **Reutilización:** Mobile = Web = Desktop (mismo componentes)
3. **Mantenibilidad:** Bug fix en 1 lugar
4. **DX:** Claro dónde va cada cosa
5. **Testing:** Tests centralizados

### 🚫 No Recomendado: Screen-Focused

**Por qué no:**
1. Duplicación (3 platforms = 3x código)
2. Mantenibilidad pesadilla
3. Escalabilidad terrible
4. No reutilizable

---

## ✅ FASE 1 COMPLETADA: DESIGN TOKENS LISTOS

**Status:** 2/3 fases completadas

| Fase | Status | Duración |
|------|--------|----------|
| 1: Design Tokens | ✅ COMPLETADA | 2h |
| 2: Componentes Compuestos | ⏳ PRÓXIMA | 3h |
| 3: Refactor Screens | ⏳ FINAL | 1.5h |

**Total Remaining:** 4.5 horas

---

## PRÓXIMO PASO: FASE 2 - COMPONENTES COMPUESTOS

### Cuáles crear:

1. **FormField** - Reusable form input component  
   - Label + Input + Error message
   - Ya documentado arriba
   
2. **PasswordStrengthIndicator** - Indicator de fuerza
   - 3 niveles (débil, medio, fuerte)
   
3. **AuthCard** - Card especializada para auth
   - Title + Description + Content
   
4. **AuthLayout** - Background + container común
   - Gradiente + centrado
   
5. **LoginForm** - Form COMPLETO (no solo UI)
   - useAuth hook
   - Validación
   - Error handling
   - 60 líneas, reutilizable
   
6. **SignupForm** - Form COMPLETO
   - Same pattern as LoginForm

### Resultado:
- LoginScreen.tsx: 100+ líneas → 15 líneas (solo routing)
- SignupScreen.tsx: 100+ líneas → 15 líneas (solo routing)
- Componentes reutilizables para web/desktop
