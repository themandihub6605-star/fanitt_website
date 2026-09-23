import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fixes the SPA scroll-restoration bug: React Router does not reset the
 * window's scroll position on navigation, so if a user scrolls to the
 * bottom of one page and then navigates to another, the new page opens
 * already scrolled down.
 *
 * Mount this ONCE inside your <BrowserRouter> (or equivalent), above your
 * <Routes>. It renders nothing — it just listens for route changes.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 'instant' avoids a visible smooth-scroll animation on every navigation
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}