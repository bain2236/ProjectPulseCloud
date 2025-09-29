// initTheme.js
// Example contract each theme bundle should expose:
// window.initTheme({ openSection, trackEvent, getSessionEntry })
//
// openSection(name) -> opens the semantic HTML section
// trackEvent(name, props) -> records analytics events via your wrapper
// getSessionEntry() -> returns stored referrer/utm info

export function initTheme({ openSection, trackEvent, getSessionEntry }) {
  // Example: when theme loads, send theme_entered
  const theme = window.__THEME_NAME || 'unknown';
  const start = performance.now();
  trackEvent('theme_entered', { theme });

  // wire clicks on scene objects to openSection
  // For demonstration we'll mock a clickable element
  document.querySelectorAll('[data-theme-object]').forEach(el => {
    el.addEventListener('click', (e) => {
      const name = el.getAttribute('data-theme-object');
      trackEvent('object_clicked', { theme, objectName: name });
      openSection(name);
    });
  });

  // expose a cleanup if needed
  return {
    unload() {
      // send theme_exited with duration
      const dur = Math.round(performance.now() - start);
      trackEvent('theme_exited', { theme, duration_ms: dur });
    }
  };
}
