# Design Foundations — MVP UI/UX

Este documento define el sistema de diseño para la interfaz de usuario. Se basa en los principios de baja carga cognitiva, captura rápida inspirada en GTD y una jerarquía visual mínima.

## Filosofía de Diseño

- **Baja carga cognitiva:** La interfaz debe ser intuitiva y no requerir que el usuario piense demasiado.
- **Captura rápida inspirada en GTD:** Facilitar la entrada de pensamientos e ideas sin fricción.
- **Jerarquía visual mínima:** Un diseño limpio y despejado donde el contenido es el protagonista.
- **UI suave y similar a contenedores:** Usar superficies y bordes suaves para agrupar contenido relacionado.
- **Un color dominante por pantalla:** El color primario se usa con intención para guiar al usuario.

> “Esto no es un gestor de tareas. Es un lugar donde los pensamientos pueden descansar.”

---

## Paleta de Colores

### Color Primario (Núcleo de la Marca)
Utilizado para el foco, estados activos, acciones primarias y reflejos sutiles.

- **Primary / Purple**
  - HEX: `#7C5CFA`

#### Variantes Primarias
Opcionales pero recomendadas para añadir profundidad.

- **Primary / Soft**
  - HEX: `#EAE6FF`
  - Uso: fondos suaves, estados de selección.

- **Primary / Dark**
  - HEX: `#5B3EDB`
  - Uso: hover, énfasis.

---

### Colores Neutros (Estructura Cognitiva)

- **Background**
  - HEX: `#FAFAFB`
  - Uso: fondo principal de la aplicación.

- **Surface**
  - HEX: `#FFFFFF`
  - Uso: tarjetas, contenedores, modales.

- **Border**
  - HEX: `#E5E7EB`
  - Uso: separadores sutiles, contornos.

---

### Colores de Texto

- **Text / Primary**
  - HEX: `#111827`
  - Uso: contenido principal, texto de inputs.

- **Text / Secondary**
  - HEX: `#6B7280`
  - Uso: metadatos, etiquetas secundarias.

- **Text / Muted**
  - HEX: `#9CA3AF`
  - Uso: placeholders, pistas.

---

### Estados Semánticos (Uso Mínimo)
Los colores semánticos nunca deben dominar la interfaz.

- **Success**
  - HEX: `#16A34A`
  - Uso: texto de confirmación, iconos.

- **Warning**
  - HEX: `#D97706`
  - Uso: feedback de precaución.

- **Error**
  - HEX: `#DC2626`
  - Uso: solo para errores de validación.

---

## Tipografía

### Familia de Fuentes

**Inter**

- Fuente: Google Fonts
- Tipo: Sans-serif
- Diseñada para la legibilidad en pantalla.
- Neutral, moderna y no intrusiva.

### Grosores de Fuente (Solo estos)

- Regular — `400`
- Medium — `500`
- SemiBold — `600`

> Evitar Bold (700+) en el MVP para reducir el ruido visual.

### Escala Tipográfica y Uso

#### Título de Pantalla (Uso muy limitado)
- Font size: `20–24px`
- Font weight: `600`
- Line height: `1.3`
- Uso: título de la página (si es necesario).

#### Texto Principal (Contenido primario)
- Font size: `16px`
- Font weight: `400`
- Line height: `1.6`
- Uso: notas, escritura, contenido central.

#### Texto Secundario
- Font size: `14px`
- Font weight: `400–500`
- Line height: `1.5`
- Uso: marcas de tiempo, texto de ayuda, metadatos.

#### Texto de Placeholder
- Font size: `16px`
- Font weight: `400`
- Color: `#9CA3AF`
- Uso: pistas en inputs, estados vacíos.

### Principios Tipográficos

- Una única familia de fuentes.
- No usar todo en mayúsculas.
- No usar fuentes decorativas.
- Espaciado de letras normal.
- Legibilidad > personalidad.

> La interfaz debe desaparecer. El contenido debe sentirse seguro y sin esfuerzo.

---

## Sistema de Espaciado (Nuevo)

Se utiliza una escala de espaciado basada en una unidad de `4px` para mantener la consistencia en márgenes, paddings y diseños.

- `space-0.5`: `2px`
- `space-1`: `4px` (unidad base)
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px` (base para texto)
- `space-5`: `20px`
- `space-6`: `24px`
- `space-8`: `32px`
- `space-10`: `40px`
- `space-12`: `48px`
- `space-16`: `64px`

---

## Border Radius (Nuevo)

Se definen radios de borde para mantener la consistencia en la suavidad de las esquinas.

- `rounded-sm`: `2px`
- `rounded`: `4px`
- `rounded-md`: `6px` (predeterminado para inputs, botones)
- `rounded-lg`: `8px` (predeterminado para tarjetas, contenedores)
- `rounded-xl`: `12px`
- `rounded-full`: `9999px`

---

## Sombras / Elevación (Nuevo)

Se utilizan para crear una sensación de profundidad y separar superficies.

- **sm (sutil)**
  - `0 1px 2px 0 rgb(0 0 0 / 0.05)`
  - Uso: elementos de UI pequeños, como avatares.

- **md (estándar)**
  - `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
  - Uso: tarjetas, botones activos.

- **lg (prominente)**
  - `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
  - Uso: modales, popovers.

---

## Componentes Base (Definiciones Iniciales) (Nuevo)

Estas son las directrices para los componentes más fundamentales.

### Botón (`Button`)

- **Padding:** `space-2` (vertical), `space-4` (horizontal)
- **Border Radius:** `rounded-md`
- **Typo:** Texto Secundario (14px, 500)
- **Transición:** `transition-colors duration-200`

#### Variantes:

- **Primary:**
  - Fondo: `Primary / Purple` (`#7C5CFA`)
  - Texto: `Surface` (`#FFFFFF`)
  - Hover: `Primary / Dark` (`#5B3EDB`)
  - Sombra: `md`

- **Secondary / Ghost:**
  - Fondo: `transparent`
  - Texto: `Text / Secondary` (`#6B7280`)
  - Hover: Fondo `Primary / Soft` (`#EAE6FF`), Texto `Primary / Purple` (`#7C5CFA`)

### Input de Texto (`Input`)

- **Padding:** `space-3` (vertical y horizontal)
- **Border Radius:** `rounded-md`
- **Typo:** Texto Principal (16px, 400)
- **Borde:** `1px solid Border` (`#E5E7EB`)
- **Fondo:** `Surface` (`#FFFFFF`)

#### Estados:

- **Focus:**
  - Borde: `1px solid Primary / Purple` (`#7C5CFA`)
  - Sombra: `0 0 0 3px Primary / Soft` (`#EAE6FF`)
- **Error:**
  - Borde: `1px solid Error` (`#DC2626`)
- **Disabled:**
  - Fondo: `Background` (`#FAFAFB`)
  - Texto: `Text / Muted` (`#9CA3AF`)

### Tarjeta (`Card`)

- **Padding:** `space-6`
- **Border Radius:** `rounded-lg`
- **Borde:** `1px solid Border` (`#E5E7EB`)
- **Fondo:** `Surface` (`#FFFFFF`)
- **Sombra:** `md`
