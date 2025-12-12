# LinkPitch Landing Page Documentation

## Overview

The LinkPitch landing page has been rebuilt with an Apple-inspired design system, featuring smooth animations, high-fidelity UI components, and seamless Clerk authentication integration.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Forms**: react-hook-form + Zod validation
- **Auth**: Clerk (Korean localization)
- **Icons**: Lucide React (stroke-width: 1.5px)
- **Fonts**: Inter (via Google Fonts)

## Design System

### Colors

- **Background**: `#050505` (Deep Charcoal Black)
- **Surface/Cards**: `#141414` with `border-white/10`
- **Primary Accent**: Blue Gradient (`from-[#2F80ED] to-[#007AFF]`)
- **Alert Accent**: `#FF453A` (Red/Orange)
- **Text**:
  - Headings: `text-white`
  - Body: `text-[#A1A1A6]` (Cool Gray)

### Spacing & Layout

- **Border Radius**: `rounded-[20px]` for cards, `rounded-full` for buttons
- **Container Max Width**: `max-w-7xl` for content sections
- **Padding**: `px-6 md:px-20` (responsive)

## Component Structure

All landing page components are located in `/components/landing/`:

### 1. AppleNavbar (`apple-navbar.tsx`)

**Purpose**: Fixed top navigation with glassmorphism effect

**Features**:
- Sticky position with backdrop blur
- Clerk authentication integration (SignedIn/SignedOut states)
- Smooth fade-in animation on mount
- Responsive design

**Props**: None (uses Clerk hooks internally)

### 2. HeroSection (`hero-section.tsx`)

**Purpose**: Main hero section with value proposition

**Features**:
- Floating dashboard mockup with infinite y-axis animation
- Aurora glow effect (blue gradient blur)
- Scroll-to-form CTA button
- Staggered text animations
- Responsive typography (4xl → 7xl)

**Key Animations**:
- Eyebrow badge: `opacity 0→1, y 20→0`
- Headline: Staggered with 0.1s delay
- Dashboard: `y: [0, -20, 0]` infinite loop (4s duration)

### 3. ProblemSection (`problem-section.tsx`)

**Purpose**: Highlight customer pain points

**Features**:
- 2-column grid (1 col on mobile)
- Icon badges with red accent
- Text color animation on scroll (`#666` → `white`)
- Hover border transition

**Content**: 2 problem cards with FileX2 icons

### 4. SolutionBento (`solution-bento.tsx`)

**Purpose**: Feature showcase in Bento Grid layout

**Features**:
- 3-column responsive grid
- 6 feature cards with unique animations:
  1. **Chrome Scan**: Green scanning line animation
  2. **5-Min Processing**: Rotating loader (spans 2 cols)
  3. **Hybrid Injection**: Staggered item reveal
  4. **CTA Button**: Pulsing KakaoTalk button (highlighted)
  5. **Deep Link Tracking**: Progress bar (0% → 80%)
  6. **Hot Lead**: Glowing flame icon

**Grid Layout**:
```css
grid-cols-1 md:grid-cols-3
Card 2: md:col-span-2
```

### 5. SocialProofPricing (`social-proof-pricing.tsx`)

**Purpose**: Display social proof metrics and pricing

**Features**:
- 3 large gradient text statistics
- Centered pricing card
- Strikethrough original price
- Gradient pricing text
- Feature checklist with custom bullets

**Stats**:
- 300%↑ (읽음률 증가)
- Hot Lead (자동 감지)
- 20 mins (평균 제작 시간)

### 6. PreRegisterForm (`pre-register-form.tsx`)

**Purpose**: Collect pre-registration data

**Features**:
- Form validation with Zod schema
- Custom checkbox with smooth toggle animation
- Conditional textarea (shows when checkbox is checked)
- Loading state on submit
- Toast notification on success
- Responsive input styling

**Form Fields**:
- Name (required, min 2 chars)
- Company/Role (required)
- Email (required, email validation)
- Budget (select dropdown)
- Feedback (optional, shown when opted-in)

**Custom Checkbox**:
- Uses `div` instead of native checkbox
- Circle border → Blue filled circle with check icon
- Click handler on parent div

### 7. AppleFooter (`apple-footer.tsx`)

**Purpose**: Simple footer with branding

**Features**:
- Fade-in animation on scroll
- Minimal design
- Copyright notice

## Animation Patterns

### Framer Motion Best Practices

All sections use consistent scroll reveal animations:

```tsx
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.6, ease: 'easeOut' }}
```

### Staggered Animations

For multiple items, use incremental delays:

```tsx
transition={{ duration: 0.6, delay: index * 0.1 }}
```

### Hover Effects

Cards use subtle border brightening:

```css
hover:border-white/20 transition-all duration-300
```

## Responsive Design

### Breakpoints

- Mobile: Default (< 768px)
- Desktop: `md:` prefix (≥ 768px)

### Typography Scale

- H1 Hero: `text-4xl md:text-7xl`
- H2 Sections: `text-3xl md:text-5xl`
- Body: `text-base md:text-lg`

### Grid Behavior

- Bento Grid: `grid-cols-1 md:grid-cols-3`
- Problem Section: `grid-cols-1 md:grid-cols-2`
- Stats: `grid-cols-1 md:grid-cols-3`

## Integration with Clerk

The navbar seamlessly integrates with Clerk authentication:

```tsx
<SignedOut>
  {/* Show login/signup buttons */}
</SignedOut>
<SignedIn>
  {/* Show dashboard link + UserButton */}
</SignedIn>
```

**Clerk Configuration** (in `/app/layout.tsx`):
- Korean localization: `koKR`
- Custom color: `#f59e0b` (amber)
- Custom sign-in title

## File Structure

```
/components/landing/
├── apple-navbar.tsx
├── hero-section.tsx
├── problem-section.tsx
├── solution-bento.tsx
├── social-proof-pricing.tsx
├── pre-register-form.tsx
└── apple-footer.tsx

/app/page.tsx (main landing page)
```

## Performance Optimizations

1. **Client-Side Only**: All components use `'use client'` for animations
2. **Viewport Once**: `viewport={{ once: true }}` prevents re-animation
3. **Lazy Animations**: Components animate only when scrolled into view
4. **Optimized Images**: No external images, all CSS-based visuals

## Accessibility

- Semantic HTML structure
- Proper form labels
- Focus states on inputs (`focus:ring-2`)
- Keyboard-accessible custom checkbox (click handler on parent div)
- ARIA-friendly animations (respects prefers-reduced-motion if needed)

## Testing

Build successfully tested:
```bash
pnpm build
# ✓ Compiled successfully
```

## Future Enhancements

1. Add actual form submission endpoint (currently simulated)
2. Implement analytics tracking for CTA clicks
3. Add A/B testing for different CTAs
4. Create admin dashboard for pre-registration data
5. Add video/GIF demonstrations
6. Implement dark/light mode toggle (if needed)

## Maintenance Notes

- All animations are centralized using Framer Motion
- Color tokens follow the design system (can be extracted to CSS variables if needed)
- Form validation schema is in the component (can be moved to `/lib/validations/` for reuse)
- Toast notifications use `sonner` (already configured in layout)

---

**Last Updated**: 2025-12-12
**Author**: Claude Code
**Version**: 1.0.0
