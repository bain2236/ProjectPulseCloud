# PulseCloud - AboutMe-Vibe

A beautiful, interactive professional profile page with Voronoi word cloud visualization built with Next.js, React, TypeScript, and Framer Motion. This project is contained within the `/project` directory.

## Features

- 🎨 **Neon Dark Theme** - Black background with cyan/pink neon highlights
- 🔮 **Voronoi Word Cloud** - Interactive concept visualization using d3-delaunay
- ✨ **Smooth Animations** - Powered by Framer Motion with hover/click effects
- 📱 **Responsive Design** - Optimized for desktop and mobile devices
- 🎯 **Tab-based Navigation** - Filter concepts by Personal/Leader/Engineer/Colleague
- 🚀 **Performance Optimized** - Debounced resize, useMemo, and reduced motion support
- ♿ **Accessible** - WCAG compliant with keyboard navigation and screen reader support

## Quick Start

All commands should be run from the `project` directory.

### Option 1: StackBlitz (Recommended)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/your-repo/aboutme-vibe)

### Option 2: Local Development

```bash
# Navigate to the project directory
cd project

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Option 3: Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/aboutme-vibe)

## Configuration

Edit `project/public/profile.json` to customize your profile:

```json
{
  "profile": {
    "displayName": "Your Name",
    "bio": "Your bio here...",
    "avatar": "https://your-avatar-url.jpg",
    "location": "Your Location",
    "website": "https://your-website.com"
  },
  "concepts": [
    {
      "id": "concept-001",
      "label": "your-skill",
      "tabId": "engineer",
      "weight": 0.9,
      "confidence": 0.85
    }
  ]
}
```

## Technical Details

### Performance Features
- **Voronoi Computation**: Memoized with d3-delaunay for optimal cell generation
- **Resize Handling**: Debounced at 150ms to prevent excessive recalculations
- **Animation Optimization**: Uses `will-change` sparingly and respects `prefers-reduced-motion`
- **Memory Management**: Proper cleanup of intervals and event listeners

### Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Readers**: Semantic HTML with proper ARIA labels
- **Color Contrast**: High contrast ratios for text readability
- **Reduced Motion**: Fallbacks for users with motion sensitivity

### Animation System
- **Hover Effects**: Directional pulse animations based on cursor position
- **Click Effects**: Radial fill transitions with modal entrance/exit
- **Text Reveal**: Progressive text disclosure with masked animations
- **Tab Transitions**: Smooth layoutId animations between active states

## File Structure (`/project`)

```
app/
├── globals.css          # Tailwind + neon theme styles
├── layout.tsx          # App shell with fonts
└── page.tsx           # Main application component

components/
├── ProfileCard.tsx     # Left column profile information
├── TabStrip.tsx       # Tab navigation component  
├── VoronoiCloud.tsx   # Main Voronoi visualization
└── ConceptModal.tsx   # Evidence modal with text reveal

lib/
├── types.ts           # TypeScript interfaces
└── utils.ts          # Utility functions (recency, mapping, etc.)

public/
└── profile.json      # Profile data source
```

## Deployment Notes

- **StackBlitz**: Best for demos and quick iterations
- **Vercel**: Recommended for production deployments
- **Static Export**: Configured for static hosting (no server required)
- **Asset Optimization**: Images are unoptimized for static export compatibility

## Browser Support

- Chrome 88+
- Firefox 85+  
- Safari 14+
- Edge 88+

Requires modern browser support for CSS Grid, Flexbox, and ES2020 features.

## License

MIT - feel free to use this as a template for your own profile!
