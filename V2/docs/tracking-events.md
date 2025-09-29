# Tracking events (recommended)

Recommended events to instrument inside theme bundles and the app:

1. theme_selected
   - When user changes theme in the selector.
   - props: { theme }

2. theme_entered
   - When theme assets finish loading and `initTheme` is called.
   - props: { theme, load_time_ms }

3. object_clicked
   - When user clicks an interactive object (tile/planet/box).
   - props: { theme, objectName, section }

4. theme_exited
   - When user exits a theme or switches back to Reader mode.
   - props: { theme, duration_ms }

5. conversion_contact
   - When user clicks to email, view resume, or contact.
   - props: { theme, utm_source, referrer, sessionId }

# Implementation notes
- Capture `document.referrer` + UTM params on first load and store in sessionStorage.
- Attach a sessionId (UUID) to each visitor and include it in conversion events.
- Queue events if offline and flush on `navigator.onLine`.
