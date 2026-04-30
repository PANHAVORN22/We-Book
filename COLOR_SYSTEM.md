# BookVault Color System

## Core Colors

### Primary - Purple/Indigo
```
Name: Primary
OKLCh: oklch(0.55 0.25 280)
Light Mode: #6366f1 (approx)
Dark Mode: oklch(0.65 0.25 280)
Usage: Main brand color, buttons, links, accents
Variants:
  - /10: oklch(0.55 0.25 280 / 0.1) - Backgrounds
  - /20: oklch(0.55 0.25 280 / 0.2) - Light backgrounds
  - /30: oklch(0.55 0.25 280 / 0.3) - Hover states
  - /50: oklch(0.55 0.25 280 / 0.5) - Focus rings
```

### Secondary - Golden Yellow
```
Name: Secondary
OKLCh: oklch(0.72 0.22 45)
Light Mode: #eab308 (approx)
Dark Mode: oklch(0.8 0.22 45)
Usage: Highlights, feature accents, alerts
Variants:
  - /10: Light backgrounds
  - /20: Feature card backgrounds
  - /30: Hover states
```

### Accent - Coral Orange
```
Name: Accent
OKLCh: oklch(0.62 0.25 20)
Light Mode: #fb923c (approx)
Dark Mode: oklch(0.75 0.25 20)
Usage: Call-to-action, emphasis, secondary actions
Variants:
  - /10: Subtle backgrounds
  - /20: Card backgrounds
  - /30: Hover states
```

## Neutral Colors

### Backgrounds
```
Light Background: oklch(0.98 0.01 280)
Light Mode: #f8f7fb (approx - soft purple tint)

Dark Background: oklch(0.15 0.02 280)
Dark Mode: #1a1825 (approx - dark purple)

Foreground (Light): oklch(0.12 0.02 280)
Foreground (Dark): oklch(0.95 0.01 280)

Secondary Background: oklch(0.2 0.02 280)
```

## Gradient Combinations

### Primary to Accent
```css
background: linear-gradient(to right, 
  oklch(0.55 0.25 280),
  oklch(0.62 0.25 20)
);
```
**Usage**: Hero buttons, main CTAs, primary interactive elements

### Primary to Secondary
```css
background: linear-gradient(to right,
  oklch(0.55 0.25 280),
  oklch(0.72 0.22 45)
);
```
**Usage**: Feature highlights, secondary CTAs

### Multi-color Gradient
```css
background: linear-gradient(to right,
  oklch(0.55 0.25 280),
  oklch(0.62 0.25 20),
  oklch(0.6 0.2 180)
);
```
**Usage**: Large hero sections, dramatic displays

## Shadow System

### Primary Shadow (for elevation)
```css
box-shadow: 0 20px 25px -5px rgb(99 102 241 / 0.2);
```

### Accent Shadow (for emphasis)
```css
box-shadow: 0 20px 25px -5px rgb(251 146 60 / 0.2);
```

### Subtle Shadow (for depth)
```css
box-shadow: 0 20px 25px -5px rgb(99 102 241 / 0.1);
```

## Border and Input System

### Border Colors
```
Default: border-primary/10 (very subtle)
Hover: border-primary/30 (more visible)
Focus: border-primary/50 (clear indication)
```

### Input Styling
```
Background: bg-background with semi-transparent overlay
Border: border-primary/30
Focus: focus:border-primary/50 focus:ring-primary/20
Placeholder: placeholder:text-foreground/40
```

## Text Colors

### Light Mode
```
Primary Text: oklch(0.12 0.02 280) - Dark purple
Secondary Text: oklch(0.12 0.02 280 / 0.6) - Muted purple
Tertiary Text: oklch(0.12 0.02 280 / 0.4) - Very muted
```

### Dark Mode
```
Primary Text: oklch(0.95 0.01 280) - Bright white
Secondary Text: oklch(0.95 0.01 280 / 0.7) - Dimmed white
Tertiary Text: oklch(0.95 0.01 280 / 0.5) - Very dimmed
```

## Component-Specific Colors

### Buttons
- **Primary Button**: `bg-gradient-to-r from-primary to-accent`
- **Secondary Button**: `border-primary/30 text-foreground hover:bg-primary/5`
- **Ghost Button**: `text-foreground hover:text-primary hover:bg-primary/10`

### Cards
- **Default Card**: `bg-white/50 dark:bg-foreground/5 backdrop-blur-sm`
- **Elevated Card**: `bg-white/60 border-primary/20 shadow-2xl`
- **Feature Card**: `bg-gradient-to-br from-primary/10 to-accent/10`

### Inputs
- **Text Input**: `bg-background border-primary/30 focus:ring-primary/20`
- **Select**: `bg-white/60 dark:bg-foreground/10 border-primary/20`

### Alerts
- **Error**: `bg-destructive/10 border-destructive/30 text-destructive`
- **Success**: `bg-primary/10 border-primary/30 text-primary`
- **Warning**: `bg-secondary/10 border-secondary/30 text-secondary`

## Accessibility Notes

### Contrast Ratios
- Primary text on light backgrounds: **7:1** (AAA)
- Secondary text on light backgrounds: **4.5:1** (AA)
- Text on gradient backgrounds: **5.1** (AA)

### Color Blind Friendly
- Avoid relying solely on color for information
- Use icons and text labels alongside colors
- Sufficient contrast for deuteranopia and protanopia

## Browser Support

### OKLCh Color Space
- Chrome 111+
- Firefox 113+
- Safari 17.2+
- Edge 111+

### Fallbacks
For older browsers, consider providing:
```css
@supports not (color: oklch(0 0 0)) {
  /* Hex color fallbacks */
  background: #6366f1;
}
```

## Implementation Examples

### Hero Button
```jsx
<Button className="bg-gradient-to-r from-primary to-accent text-white 
  hover:shadow-xl hover:shadow-primary/40">
  Start Reading
</Button>
```

### Feature Card
```jsx
<div className="bg-white/50 dark:bg-foreground/5 backdrop-blur-sm 
  border border-primary/20 hover:border-primary/30 
  hover:shadow-2xl hover:shadow-primary/10">
  {/* Card content */}
</div>
```

### Input Field
```jsx
<input className="bg-background border-primary/30 
  focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
```

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
