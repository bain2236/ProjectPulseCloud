# Analytics & User Feedback System

This document covers the analytics implementation, provider setup, and user feedback collection system for the PulseCloud portfolio.

## Overview

The analytics system is designed with privacy-first principles:
- **No cookies required** - Uses sessionStorage for temporary session tracking
- **GDPR compliant** - No personal data collection or cross-site tracking
- **Provider agnostic** - Easy to switch between analytics providers
- **Development friendly** - Console logging for local development

## Current Implementation

### Analytics Events Tracked

The system automatically tracks these user interactions:

- **Page Views** - When users visit the site
- **Tab Changes** - When users switch between Personal/Leader/Engineer/Colleague tabs
- **Concept Clicks** - When users click on concepts in the Voronoi cloud
- **Modal Interactions** - Opening/closing concept modals with duration tracking
- **Contact Actions** - When users click contact links (CV, LinkedIn, etc.)
- **Site Ratings** - User feedback on site experience

### Privacy Compliance

- Uses `sessionStorage` instead of cookies (cleared when browser tab closes)
- No personal data collection
- Anonymous session IDs
- Transparent privacy notice in footer
- No cross-site tracking

## Provider Setup

### Plausible Analytics (Recommended)

**Why Plausible?**
- Privacy-first design (GDPR compliant by default)
- Lightweight (~1KB script)
- Simple, focused dashboard
- Open source
- No cookie banners needed

**Setup Steps:**

1. **Sign up at [plausible.io](https://plausible.io)**
   - Create account
   - Add your domain (e.g., `yourname.dev` or `yourname.vercel.app`)

2. **Get your script tag**
   - Go to your site settings in Plausible
   - Copy the script tag (looks like this):
   ```html
   <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
   ```

3. **Update the analytics provider**
   - Edit `project/hooks/useAnalytics.ts`
   - Change line 8 from:
   ```typescript
   initAnalytics(consoleProvider);
   ```
   - To:
   ```typescript
   initAnalytics(plausibleProvider);
   ```

4. **Add script to layout**
   - Edit `project/app/layout.tsx`
   - Add the script tag inside the `<head>` section:
   ```typescript
   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
         <head>
           <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
         </head>
         <body className="font-sans antialiased">
           {children}
         </body>
       </html>
     );
   }
   ```

5. **Update sitemap configuration**
   - Edit `project/next-sitemap.config.js`
   - Change the `siteUrl` to your actual domain:
   ```javascript
   module.exports = {
     siteUrl: 'https://yourdomain.com', // Update this
     // ... rest of config
   };
   ```

6. **Update privacy footer email**
   - Edit `project/components/PrivacyFooter.tsx`
   - Change `privacy@yourdomain.com` to your actual email

### PostHog Analytics (Alternative)

**Why PostHog?**
- Advanced user journey analysis
- Feature flags and A/B testing
- Session recordings
- Free tier (1M events/month)
- More detailed custom event tracking

**Setup Steps:**

1. **Sign up at [posthog.com](https://posthog.com)**
2. **Get your project API key**
3. **Update `project/hooks/useAnalytics.ts`**:
   ```typescript
   initAnalytics(posthogProvider);
   ```
4. **Add PostHog script to layout** (see PostHog docs for exact script)

## User Feedback System

### Site Rating Component

The portfolio includes a floating rating widget that allows users to:
- Rate the overall experience (1-5 stars)
- Provide specific feedback on animations, design, or functionality
- Submit anonymous comments

**Features:**
- Non-intrusive floating button
- Smooth animations
- Anonymous feedback collection
- Analytics integration for rating events

### Feedback Analytics

The system tracks:
- Rating submissions with scores
- Feedback categories (animations, design, functionality)
- User engagement with the feedback system

## Future Enhancements

### Phase 1: Enhanced Tracking
- **Performance Monitoring**
  - Page load times
  - Animation performance
  - Error tracking
  - Core Web Vitals

- **User Journey Analysis**
  - Most popular concepts
  - Tab usage patterns
  - Modal engagement rates
  - Session duration tracking

### Phase 2: Advanced Analytics
- **A/B Testing**
  - Test different color schemes
  - Animation variations
  - Layout improvements
  - Content positioning

- **Custom Events**
  - Scroll depth tracking
  - Hover interactions
  - Keyboard navigation usage
  - Mobile vs desktop behavior

### Phase 3: User Experience Optimization
- **Heatmap Integration**
  - Click heatmaps
  - Scroll behavior
  - Attention mapping

- **Conversion Tracking**
  - Contact form submissions
  - External link clicks
  - Download tracking
  - Social media engagement

### Phase 4: Advanced Features
- **Real-time Analytics Dashboard**
  - Live visitor tracking
  - Real-time feedback monitoring
  - Performance alerts

- **Automated Insights**
  - Weekly performance reports
  - User behavior trends
  - Optimization suggestions

## Analytics Insights for Portfolio Optimization

### Key Metrics to Monitor

1. **Engagement Metrics**
   - Average session duration
   - Pages per session
   - Bounce rate
   - Return visitor rate

2. **Content Performance**
   - Most clicked concepts
   - Popular tabs
   - Modal engagement rates
   - Evidence reading patterns

3. **User Experience**
   - Site rating scores
   - Feedback sentiment
   - Performance metrics
   - Error rates

4. **Conversion Tracking**
   - Contact link clicks
   - CV downloads
   - External profile visits
   - Social media clicks

### Optimization Strategies

**Based on Analytics Data:**

- **Low engagement on certain concepts?** → Improve content or positioning
- **High bounce rate?** → Optimize loading performance or first impression
- **Poor ratings?** → Address specific feedback themes
- **Low contact conversions?** → Make contact options more prominent
- **Mobile performance issues?** → Optimize responsive design

## Development vs Production

### Development Mode
- Uses `consoleProvider` for local testing
- All events logged to browser console
- No external data transmission
- Easy debugging and development

### Production Mode
- Switches to chosen provider (Plausible/PostHog)
- Real analytics data collection
- Privacy-compliant tracking
- Performance optimized

## Troubleshooting

### Common Issues

1. **Analytics not working in production**
   - Check script tag is correctly added to layout
   - Verify domain is added to analytics provider
   - Check browser console for errors

2. **Events not appearing in dashboard**
   - Ensure provider is correctly initialized
   - Check network requests in browser dev tools
   - Verify event names match provider expectations

3. **Privacy concerns**
   - Review privacy notice in footer
   - Ensure sessionStorage is being used (not cookies)
   - Verify no personal data is being collected

## Security & Privacy

- **No personal data collection**
- **Anonymous session tracking only**
- **GDPR compliant by design**
- **Transparent privacy practices**
- **User control over data**

## Support

For analytics setup issues:
1. Check this documentation
2. Review provider-specific documentation
3. Check browser console for errors
4. Verify all configuration steps completed

---

*Last updated: September 2024*
