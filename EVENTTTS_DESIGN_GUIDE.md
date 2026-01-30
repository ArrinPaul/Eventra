# Eventtts Color Palette & UI Implementation

This document outlines the color scheme and UI components created to match the Eventtts website design.

## 🎨 Color Palette

### Primary Colors
- **Primary Red**: `#E53935` - Used for CTAs, buttons, and brand elements
- **Secondary Blue**: `#3B82F6` - Used for sections and accents
- **Accent Light Red**: Soft red/pink tint for backgrounds

### Feature Icon Colors
These vibrant gradients are used for feature icons:
- **Purple**: `#8B5CF6` - `icon-gradient-purple`
- **Cyan**: `#06B6D4` - `icon-gradient-cyan`
- **Green**: `#10B981` - `icon-gradient-green`
- **Orange**: `#F59E0B` - `icon-gradient-orange`
- **Pink**: `#EC4899` - `icon-gradient-pink`

### Background Colors
- **Pure White**: `#FFFFFF` - Main background
- **Soft Pink/Red**: `bg-soft-pink` - Light section backgrounds
- **Soft Blue**: `bg-soft-blue` - Participant section backgrounds
- **Soft Purple**: `bg-soft-purple` - Alternative section backgrounds
- **Dark Navy**: `#1E293B` - Dark mode and footer

### Gradient Backgrounds
- **Red Hero Gradient**: `bg-gradient-red-hero` - Red gradient for hero sections
- **Blue Section Gradient**: `bg-gradient-blue-section` - Blue gradient for participant sections

## 🎯 Key Design Elements

### 1. Hero Sections
- **Red gradient backgrounds** with white text
- Large, bold typography
- Prominent CTAs in white with red text
- Stats cards with glassmorphic effect
- **Component**: `eventtts-hero.tsx`

### 2. Feature Icons
- **Circular gradient icons** (16x16 or 20x20)
- Subtle shadow: `shadow-feature-icon`
- Five color variations for variety
- Icons from `lucide-react`

### 3. Cards
- Clean white backgrounds
- Subtle shadows: `shadow-card`
- Hover effect: `shadow-card-hover`
- Rounded corners: `rounded-lg` or `rounded-xl`
- Smooth transitions on hover with lift effect

### 4. Buttons
- **Primary**: Red background, white text, rounded-lg
- **Secondary**: Blue background, white text
- **Outline**: White background with border
- Hover effects: opacity or color shifts

### 5. Sections
- Alternating white and soft color backgrounds
- Generous padding: `py-20`
- Container-based layouts with responsive grids

## 📁 Created Components

### 1. Color Reference (`src/components/ui/color-reference.tsx`)
Visual reference showing all colors, gradients, and UI elements. Use this to see all available styles.

### 2. Eventtts Hero (`src/components/home/eventtts-hero.tsx`)
Red gradient hero section with:
- Badge at top
- Large heading with gradient text
- Subheading
- Dual CTAs
- Stats cards with glassmorphic effect

### 3. Feature Grid (`src/components/home/feature-grid.tsx`)
Grid of features with:
- Colorful circular gradient icons
- Feature title and description
- Responsive grid (1-5 columns)
- Hover effects

### 4. Blue Feature Section (`src/components/home/blue-feature-section.tsx`)
Participant-focused section with:
- Soft blue background
- Two-column layout
- Blue gradient card showcase
- Feature list with checkmarks

## 🛠️ Usage Examples

### Basic Button
```tsx
<button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
  Create Event
</button>
```

### Feature Icon
```tsx
<div className="w-16 h-16 rounded-full icon-gradient-purple flex items-center justify-center text-white shadow-feature-icon">
  <IconComponent className="w-8 h-8" />
</div>
```

### Card
```tsx
<div className="bg-card rounded-xl shadow-card p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
  <h3 className="font-bold text-lg mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card description</p>
</div>
```

### Gradient Text
```tsx
<h1 className="text-4xl font-bold text-gradient">
  Red Gradient Heading
</h1>

<h1 className="text-4xl font-bold text-gradient-blue">
  Blue Gradient Heading
</h1>
```

### Section Backgrounds
```tsx
{/* White background */}
<section className="py-20 bg-background">
  {/* Content */}
</section>

{/* Soft pink background */}
<section className="py-20 bg-soft-pink">
  {/* Content */}
</section>

{/* Blue gradient hero */}
<section className="py-20 bg-gradient-blue-section">
  {/* Content */}
</section>
```

## 📝 Updated Files

1. **`src/app/globals.css`**
   - Updated CSS variables for light and dark modes
   - Added gradient utility classes
   - Added icon gradient classes
   - Added soft background classes

2. **`tailwind.config.ts`**
   - Added feature colors
   - Added gradient backgrounds
   - Added custom shadows

3. **New Components**
   - `src/components/ui/color-reference.tsx`
   - `src/components/home/eventtts-hero.tsx`
   - `src/components/home/feature-grid.tsx`
   - `src/components/home/blue-feature-section.tsx`

## 🚀 Next Steps

1. **Replace your home page hero** with `EventttsHero` component
2. **Update feature sections** using the `FeatureGrid` component
3. **Apply the color scheme** to existing components:
   - Update button colors to use `bg-primary`
   - Add feature icon gradients to icon sections
   - Use soft backgrounds for alternating sections
4. **Review the ColorReference** component to see all available styles
5. **Test dark mode** to ensure colors work well in both themes

## 🎨 Design Principles

- **Bold CTAs**: Primary red buttons for main actions
- **Colorful Variety**: Use all 5 icon gradient colors across features
- **Clean Spacing**: Generous whitespace and padding
- **Subtle Shadows**: Card shadows for depth without being heavy
- **Smooth Transitions**: All interactive elements have hover effects
- **Responsive Design**: Mobile-first approach with responsive grids

## 💡 Tips

- Use `bg-soft-pink` for organizer-focused sections
- Use `bg-soft-blue` for participant-focused sections
- Alternate between white and soft backgrounds for visual interest
- Keep icon gradients consistent within a section (don't mix too many)
- Use the red gradient hero for landing/home pages
- Apply `hover:-translate-y-1` for card lift effects
