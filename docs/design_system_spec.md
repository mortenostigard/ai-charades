# AI Charades: Director's Cut - Design System

## Core Design Principles

- **Dark Mode First**: Deep, dark backgrounds optimized for party environments
- **Role-Based Color Identity**: Each player role has distinct color themes
- **Mobile-First Touch Design**: 44px+ touch targets, thumb-friendly layouts
- **Smooth Animations**: Framer Motion with consistent spring physics
- **Playful & Bold**: Chunky typography with energetic gradients

## Color Palette

### Base Colors

- **Primary Background**: `bg-gray-950` (#030712)
- **Card Background**: `bg-gray-900` (#111827)
- **Card Border**: `border-gray-800` (#1f2937)
- **Primary Text**: `text-white`
- **Secondary Text**: `text-gray-400`, `text-gray-300`

### Brand Gradient (Home/Branding)

- **Main Title**: `from-purple-400 via-pink-400 to-orange-400`
- **Primary Action**: `from-purple-500 to-pink-500` with `hover:from-purple-600 hover:to-pink-600`
- **Secondary Action**: `from-orange-500 to-red-500` with `hover:from-orange-600 hover:to-red-600`

### Role-Specific Color Schemes

- **Actor Role**: Yellow family (`from-yellow-300 to-yellow-500`, `text-yellow-300`)
- **Director Role**: Cyan/Blue family (`from-cyan-400 to-blue-500`, `text-cyan-400`)
- **Audience Role**: Fuchsia/Purple family (`from-fuchsia-400 to-purple-500`, `text-fuchsia-400`)

### Timer States

- **Normal**: Role-specific colors (yellow/cyan/fuchsia)
- **Warning**: `from-orange-400 to-red-500`
- **Critical**: `from-red-400 to-red-600` with pulse animation

### Status Colors

- **Success/Active**: Green variants (`text-green-400`, `bg-green-900/40`)
- **Warning/Sabotage**: Red variants (`text-red-400`, `bg-red-900/40`)
- **Grace Period**: Amber variants (`text-amber-400`, `bg-amber-900/40`)
- **Neutral/Disabled**: Gray variants (`text-gray-400`, `bg-gray-900/60`)

## Typography

### Display Text

- **Font Weight**: `font-black` (900) for all major headings
- **Main Title**: `text-5xl md:text-6xl`
- **Page Titles**: `text-3xl`
- **Section Titles**: `text-xl` to `text-2xl`
- **Role Labels**: `text-xl font-bold`
- **Letter Spacing**: `tracking-tight` for titles, `tracking-wider` for timers

### Body Text

- **Default**: `font-medium` or `font-semibold`
- **Large**: `text-lg`
- **Small**: `text-sm` and `text-xs`

### Special Text

- **Timers**: `text-4xl font-black` with gradient text
- **Room Codes**: `text-6xl font-black font-mono`
- **Prompts**: `text-4xl md:text-5xl font-black`

## Layout Patterns

### Screen Structure

```tsx
<div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
  {/* Header - flex-shrink-0 pt-6 pb-4 */}
  {/* Main Content - flex-1 flex items-center justify-center */}
  {/* Bottom Actions - flex-shrink-0 pb-8 */}
</div>
```

### Cards

- **Background**: `bg-gray-900`
- **Border**: `border-gray-800`
- **Rounded**: `rounded-2xl`
- **Max Width**: `max-w-md mx-auto` for mobile-first
- **Padding**: `p-8` for main content, `p-4` for containers
- **Shadow**: `shadow-2xl` for prominent cards

### Buttons

- **Height**: `h-14` for primary actions
- **Width**: `w-full` with `max-w-md` or `max-w-sm` containers
- **Rounded**: `rounded-2xl`
- **Font**: `font-bold text-lg`
- **Gradients**: Use role-specific or brand gradients
- **Border**: `border-0` to remove default borders

## Animation Standards

- **Primary Library**: **`framer-motion`** is the sole animation library for this project. It should be used for all animations, from complex screen transitions to simple UI feedback. Do not add or use other animation libraries (e.g., `animate.css`) to maintain consistency and minimize bundle size.

### Framer Motion Physics

- **Spring Transition**: `{ type: "spring", stiffness: 400, damping: 17 }`
- **Tap Scale**: `whileTap={{ scale: 0.95 }}`
- **Hover Effects**: `whileHover={{ scale: 1.05 }}` (where appropriate)
- **Stagger**: `staggerChildren: 0.1` for lists

### Common Animation Patterns

- **Entry**: `initial={{ opacity: 0, y: 20 }}, animate={{ opacity: 1, y: 0 }}`
- **Critical States**: `animate={{ scale: [1, 1.05, 1] }}` with infinite repeat
- **List Items**: `initial={{ opacity: 0, x: -20 }}, animate={{ opacity: 1, x: 0 }}`
- **Exit**: `exit={{ opacity: 0, y: -20 }}`

### Animation Timing

- **Quick**: 0.5s duration for immediate feedback
- **Medium**: 0.6s for state changes
- **Pulse**: 0.5s duration for critical alerts
- **Stagger delay**: `index * 0.1` for sequential animations

## Component Patterns

### Role Headers

```tsx
<h1 className='text-xl font-bold text-transparent bg-gradient-to-r from-{role-color} bg-clip-text'>
  {ROLE_NAME}
</h1>
```

### Status Indicators

- Use gradient backgrounds with transparency: `bg-gradient-to-r from-{color}-900/40`
- Border with matching color: `border-{color}-600/50`
- Text with lighter variant: `text-{color}-300`

### Grace Period States

- **Locked State**: Use lock icon with amber colors and countdown text
- **Unlocked Transition**: Smooth animation from amber to green with glow effect
- **Countdown Display**: `text-amber-300` with format "Sabotages available in Xs"

### Interactive Elements

- All buttons use gradient backgrounds
- Consistent hover states with darker gradient variants
- Touch feedback with `whileTap` scale animations
- Disabled states with reduced opacity and grayed colors

### Mobile Optimizations

- Touch targets minimum 44px (use `min-h-[44px]` and `min-w-[44px]`)
- Primary actions in bottom third of screen
- Spacing minimum 8px between interactive elements
- Content containers with `max-w-md` for thumb reach
