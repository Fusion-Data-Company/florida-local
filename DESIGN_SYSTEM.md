# The Florida Local - Design System

**Version**: 1.0.0
**Last Updated**: 2025-10-20
**Status**: Active Implementation

---

## 🎨 Design Philosophy

The Florida Local platform uses a **premium, unified design system** that combines:
- **Holographic/Metallic Effects** - For premium branding
- **Glass Morphism** - For modern, elegant overlays
- **Consistent Color Palette** - Teal, Gold, Bronze theme
- **Video/Abstract Backgrounds** - For dynamic visual interest
- **Standardized Typography** - Clear hierarchy across all pages

---

## 📐 Layout Patterns

### Standard Page Structure
```tsx
<div className="min-h-screen relative">
  {/* Background Layer - Video or Abstract */}
  <VideoBackground videoSrc="..." overlayOpacity={0.3} />
  {/* OR */}
  <div className="absolute inset-0 glass-section-overlay"></div>

  {/* Content Layer */}
  <div className="relative z-10">
    {/* Page content here */}
  </div>
</div>
```

### Section Structure
```tsx
<section className="relative py-16">
  {/* Section overlay for readability */}
  <div className="absolute inset-0 glass-section-overlay"></div>

  {/* Container */}
  <div className="container mx-auto px-4 relative z-10">
    {/* Content */}
  </div>
</section>
```

---

## 🎨 Color System

### Primary Colors
- **Teal**: `#008B8B` - Primary brand color
- **Gold**: `#D4AF37` - Premium accent
- **Bronze**: `#CD7F32` - Secondary accent

### Gradients
- **Teal Gradient**: `from-[#008B8B] to-[#00CED1]`
- **Gold Gradient**: `from-[#D4AF37] to-[#FFD700]`
- **Bronze Gradient**: `from-[#CD7F32] to-[#E8C8A8]`

### Text Colors
- **On Light**: `text-gray-900` or `text-black`
- **On Dark**: `text-white`
- **On Video**: `text-white` with shadow: `style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}`

---

## 🃏 Card Components

### HolographicCard (PRIMARY)
Use for all featured content, benefits, features:

```tsx
import { HolographicCard } from "@/components/ui/holographic-card";

<HolographicCard className="holo-teal" intensity="medium">
  <div className="holo-content">
    {/* Content here */}
  </div>
</HolographicCard>
```

**Variants**:
- `holo-teal` - Use for primary features
- `holo-gold` - Use for premium features
- `holo-bronze` - Use for secondary features

**Intensity**:
- `low` - Subtle effect
- `medium` - Standard (default)
- `high` - Dramatic effect

### Standard Card
Use for data display, forms, and admin interfaces:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

## 🔘 Button System

### StardustButton (PRIMARY)
Use for main CTAs and important actions:

```tsx
import { StardustButton } from "@/components/ui/stardust-button";

<StardustButton variant="gold" size="lg">
  Action Text
</StardustButton>

<StardustButton variant="teal" size="lg">
  Secondary Action
</StardustButton>
```

**Variants**:
- `gold` - Primary actions (Create, Sign Up, Subscribe)
- `teal` - Secondary actions (View, Explore, Learn More)

### Standard Button
Use for forms, utility actions:

```tsx
import { Button } from "@/components/ui/button";

<Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
  Standard Action
</Button>
```

---

## 🏷️ Badge System

### MetallicBadge
For premium badges and tags:

```tsx
const MetallicBadge = ({ children, color = "gold", className = "" }) => {
  // Available colors: gold, platinum, bronze, emerald, ruby
  return (
    <div className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl overflow-hidden font-bold uppercase tracking-wide ${color === 'platinum' ? 'text-gray-900' : 'text-white'} transform hover:scale-105 transition-all duration-300 ${className}`}>
      <Sparkles className="h-4 w-4 relative z-10" />
      <span className="relative z-10 drop-shadow-md text-sm">{children}</span>
    </div>
  );
};
```

### Standard Badge
For status, categories:

```tsx
import { Badge } from "@/components/ui/badge";

<Badge className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
  Category
</Badge>
```

---

## 📝 Typography

### Headings

```tsx
// Page Title (Hero)
<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#008B8B] via-[#d4af37] to-[#008B8B] bg-clip-text text-transparent">
  Page Title
</h1>

// Section Title
<h2 className="text-3xl md:text-5xl font-bold text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
  Section Title
</h2>

// Subsection Title
<h3 className="text-2xl md:text-3xl font-bold text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
  Subsection Title
</h3>
```

### Body Text

```tsx
// On light backgrounds
<p className="text-lg text-gray-900 leading-relaxed">
  Body text content
</p>

// On dark/video backgrounds
<p className="text-lg text-white leading-relaxed" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
  Body text content
</p>
```

---

## 🖼️ Background Treatments

### Video Backgrounds
```tsx
import VideoBackground from '@/components/video-background';

<VideoBackground
  videoSrc="/Videos/filename.mov"
  overlayOpacity={0.3}
/>
```

**Available Videos**:
- `6028977_Riga Hyperlapse Tree Sidewalk_By_Reinis_Kaspars_Artlist_4K.mov` (18MB)
- `6272634_Trees Fountain Swans Buildings_By_Hugo_Will_Artlist_4K.mov` (18MB)
- `6272661_Jacksonville Buildings City River_By_Hugo_Will_Artlist_4K.mov` (18MB)

**Overlay Opacity Guidelines**:
- `0` - No overlay (clear video)
- `0.3` - Light overlay (good for text readability)
- `0.5` - Medium overlay (strong text contrast)

### Glass Overlays
```tsx
// Full section glass overlay
<div className="absolute inset-0 glass-section-overlay"></div>

// Light tint
<div className="absolute inset-0 glass-tint-light"></div>

// Medium tint
<div className="absolute inset-0 glass-tint-medium"></div>

// White overlay for specific sections
<div className="absolute inset-0 bg-white/90"></div>
```

### Static Backgrounds
```tsx
<div
  className="min-h-screen relative"
  style={{
    backgroundImage: "url('/backgrounds/filename.avif')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  }}
>
```

---

## ✨ Special Effects

### Premium Effects (from magic.css)

```css
/* Metallic Effects */
.metallic-teal    /* Teal metallic gradient */
.metallic-gold    /* Gold metallic gradient */
.metallic-bronze  /* Bronze metallic gradient */
.metallic-chrome  /* Chrome metallic gradient */

/* Glass Effects */
.glass-card-futuristic     /* Modern glass card */
.glass-section-overlay     /* Section overlay */
.frosted-panel             /* Frosted glass panel */

/* Interactive Effects */
.shine-sweep-hover         /* Animated shine on hover */
.apple-hover-depth         /* 3D depth on hover */
```

### Animation Classes
```css
.entrance-fade-up          /* Fade up entrance */
.entrance-scale-fade       /* Scale + fade entrance */
.card-entrance             /* Card entrance animation */
.shimmer-gold-hover        /* Gold shimmer on hover */
.shimmer-on-hover          /* Standard shimmer on hover */
```

---

## 📱 Responsive Patterns

### Container Widths
```tsx
<div className="container mx-auto px-4 lg:px-8">
  {/* Standard container */}
</div>

<div className="max-w-4xl mx-auto">
  {/* Narrow content (text-heavy) */}
</div>

<div className="max-w-7xl mx-auto">
  {/* Wide content (grids, cards) */}
</div>
```

### Grid Patterns
```tsx
// 3-column feature grid
<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

// 4-column stats
<div className="grid md:grid-cols-4 gap-6">

// 2-column content
<div className="grid md:grid-cols-2 gap-8">
```

---

## 🎯 Component Usage Guidelines

### When to use HolographicCard:
✅ Feature highlights
✅ Benefit showcases
✅ Premium content
✅ Hero sections
✅ Special promotions

### When to use Standard Card:
✅ Forms
✅ Data displays
✅ Admin panels
✅ Lists
✅ Secondary content

### When to use StardustButton:
✅ Primary CTAs
✅ Important actions
✅ Hero buttons
✅ Conversion points

### When to use Standard Button:
✅ Form submissions
✅ Navigation
✅ Utility actions
✅ Secondary CTAs

---

## 📊 Spacing System

Use Tailwind spacing scale consistently:

- **Section padding**: `py-16` (mobile), `py-20` or `py-24` (desktop)
- **Container padding**: `px-4` (mobile), `px-8` (desktop)
- **Card padding**: `p-6` or `p-8`
- **Element gaps**: `gap-4`, `gap-6`, `gap-8`
- **Margins**: `mb-6`, `mb-8`, `mb-12` for vertical rhythm

---

## 🔍 Z-Index Layers

```
1. Background Video/Image: z-0
2. Glass Overlays: z-0
3. Content Layer: z-10
4. Fixed Elements (Hero): z-50
5. Modals/Dialogs: z-100
6. Tooltips: z-200
```

---

## ✅ Implementation Checklist

For each new page/component:

- [ ] Use HolographicCard for premium content
- [ ] Apply consistent background treatment
- [ ] Use StardustButton for primary CTAs
- [ ] Add text shadows on video/dark backgrounds
- [ ] Use standard container widths
- [ ] Apply entrance animations
- [ ] Ensure responsive grid layouts
- [ ] Test z-index layering
- [ ] Verify color palette consistency

---

## 🚀 Quick Start Templates

### Premium Feature Section
```tsx
<section className="relative py-16">
  <div className="absolute inset-0 glass-section-overlay"></div>
  <div className="container mx-auto px-4 relative z-10">
    <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-white"
        style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
      Section Title
    </h2>
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <HolographicCard className="holo-teal">
        <div className="holo-content text-center">
          {/* Content */}
        </div>
      </HolographicCard>
      {/* More cards */}
    </div>
  </div>
</section>
```

### Hero Section with CTA
```tsx
<div className="container mx-auto px-4 py-16 text-center">
  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#008B8B] via-[#d4af37] to-[#008B8B] bg-clip-text text-transparent">
    Hero Title
  </h1>
  <p className="mt-6 max-w-2xl mx-auto text-lg text-white"
     style={{textShadow: '0 2px 6px rgba(0,0,0,0.9)'}}>
    Hero description
  </p>
  <div className="mt-8 flex gap-4 justify-center">
    <StardustButton variant="gold" size="lg">
      Primary Action
    </StardustButton>
    <StardustButton variant="teal" size="lg">
      Secondary Action
    </StardustButton>
  </div>
</div>
```

---

**End of Design System Document**
