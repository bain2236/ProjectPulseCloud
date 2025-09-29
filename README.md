# PulseCloud - AboutMe-Vibe

[![CI](https://github.com/bain2236/PulseCloud/actions/workflows/ci.yml/badge.svg)](https://github.com/bain2236/PulseCloud/actions/workflows/ci.yml)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![ESLint](https://img.shields.io/badge/linting-eslint-4B32C3.svg)](https://eslint.org/)

A beautiful, interactive professional profile page with a data-driven Voronoi word cloud visualization. This project uses a sophisticated data pipeline to transform raw, unstructured text from your professional life into a structured, explorable format.

This repository is a monorepo containing two main parts:

-   `/project`: The Next.js frontend application that displays the visualization.
-   `/data`: The data processing pipeline that generates the `profile.json` consumed by the frontend.

---

## Data Architecture & Pipeline

The heart of this project is the automated data pipeline that processes raw, unstructured text into the structured `profile.json` that powers the visualization.

1.  **/data/1_raw**: Contains the source material, such as your CV, recommendations, and personal notes as plain text or markdown files.
2.  **/data/3_pipeline**: A Node.js script that reads the raw files, uses an LLM to extract structured evidence and concepts, and performs post-processing like weight scaling.
3.  **/project/public/profile.json**: The final, aggregated JSON file is written to this location for the Next.js application to consume.

### How to Add New Content

To add new information to your profile, simply add a new text or markdown file to the appropriate subdirectory in `/data/1_raw` and re-run the processing script.

---

## Quick Start & Development

All development and testing commands should be run from the **root** of the repository.

1.  **Install Dependencies (Root):**
    ```bash
    npm install
    ```
2.  **Install Dependencies (Project):**
    ```bash
    cd project
    npm install
    cd ..
    ```
3.  **Set Up Environment:**
    -   Create a file at `/project/.env` and add your OpenAI API key:
        ```
        OPENAI_API_KEY=your_key_here
        ```
4.  **Generate Profile Data:**
    ```bash
    npm run pipeline:run
    ```
5.  **Run Frontend App:**
    ```bash
    cd project
    npm run dev
    ```

## Testing & Quality Assurance

This project is committed to a strict **Test-Driven Development (TDD)** workflow for all data pipeline logic. We aim 100% test coverage on all core logic files.

-   **Run all tests:**
    ```bash
    npm test
    ```
-   **Run tests with coverage report:**
    ```bash
    npm run test:coverage
    ```

---

## Production Readiness & CI/CD

This project is equipped with a full suite of tools to ensure code quality, consistency, and stability.

-   **Continuous Integration**: A GitHub Actions workflow runs on every push and pull request to the `main` branch. It automatically installs dependencies, runs the full test suite, lints the code, and performs a production build.
-   **Linting & Formatting**: We use ESLint and Prettier to enforce a consistent code style. These checks are run automatically before each commit using a `pre-commit` hook managed by `husky` and `lint-staged`.
-   **SEO & Metadata**: The application includes comprehensive `meta` tags for SEO and rich link previews on social media platforms, configured in `project/app/layout.tsx`.

---

## Frontend Features

- 🎨 **Neon Dark Theme** - Black background with cyan/pink neon highlights
- 🔮 **Voronoi Word Cloud** - Interactive concept visualization using d3-delaunay
- ✨ **Smooth Animations** - Powered by Framer Motion with hover/click effects
- 📱 **Responsive Design** - Optimized for desktop and mobile devices
- 🎯 **Tab-based Navigation** - Filter concepts by Personal/Leader/Engineer/Colleague
- 🚀 **Performance Optimized** - Debounced resize, useMemo, and reduced motion support
- ♿ **Accessible** - WCAG compliant with keyboard navigation and screen reader support
- 📊 **Analytics & Feedback** - Privacy-compliant analytics and user rating system

## Configuration

The primary configuration file, `project/public/profile.json`, is **generated automatically** by the data pipeline. To customize your profile, add or edit files in the `/data/1_raw` directory and run `npm run pipeline:run`.

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
├── layout.tsx           # App shell with fonts, metadata, and SEO tags
└── page.tsx             # Main application component

components/
├── ProfileCard.tsx     # Left column profile information
├── TabStrip.tsx       # Tab navigation component  
├── VoronoiCloud.tsx   # Main Voronoi visualization
└── ConceptModal.tsx   # Evidence modal with text reveal

lib/
├── types.ts           # TypeScript interfaces
└── utils.ts          # Utility functions (recency, mapping, etc.)

public/
└── profile.json      # Profile data source (Generated by pipeline)
```

## Deployment Notes

-   **Vercel**: Recommended for production deployments. Remember to set the `NEXT_PUBLIC_URL` environment variable to your production domain for SEO and metadata purposes.
-   **Static Export**: Configured for static export compatibility
-   **Asset Optimization**: Images are unoptimized for static export compatibility

## Analytics & User Feedback

This portfolio includes a comprehensive analytics and user feedback system designed with privacy-first principles:

- **Privacy-Compliant Analytics** - No cookies required, GDPR compliant
- **User Rating System** - Collect feedback on site experience, animations, and design
- **Performance Monitoring** - Track user interactions and site performance
- **SEO Optimization** - Automatic sitemap generation and search engine optimization

📖 **[Read the full Analytics Documentation](project/docs/analytics.md)** for setup instructions and detailed feature overview.

## Future Features
- **Multimedia Evidence**: Allow images and videos to be included as evidence sources, linking them to concepts.
- **Advanced Analytics**: A/B testing, heatmaps, and user journey analysis
- **Performance Optimization**: Real-time performance monitoring and optimization suggestions

## Browser Support

- Chrome 88+
- Firefox 85+  
- Safari 14+
- Edge 88+

Requires modern browser support for CSS Grid, Flexbox, and ES2020 features.

## License

MIT - feel free to use this as a template for your own profile!
