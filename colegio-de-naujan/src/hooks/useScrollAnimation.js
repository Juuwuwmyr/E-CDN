import { useEffect } from 'react';

/**
 * Bidirectional scroll animation hook.
 *
 * Scroll DOWN → element enters viewport → animates IN  (opacity 0→1, slide up)
 * Scroll UP   → element exits above viewport → animates OUT (opacity 1→0, slide down)
 * Scroll DOWN again → animates IN again  ♻️
 */
const useScrollAnimation = () => {
  useEffect(() => {
    let rafId;

    const checkElements = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      const windowHeight = window.innerHeight;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();

        // Element is in view (with 60px bottom buffer so it triggers a bit early)
        const inView = rect.top < windowHeight - 60 && rect.bottom > 0;

        if (inView) {
          el.classList.add('is-visible');
        } else {
          el.classList.remove('is-visible');
        }
      });
    };

    // Throttle with requestAnimationFrame for smooth performance
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkElements);
    };

    // Initial check on mount
    checkElements();

    window.addEventListener('scroll', onScroll, { passive: true });

    // MutationObserver: re-check when new nodes are added (e.g. after login)
    const mo = new MutationObserver(() => {
      checkElements();
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      mo.disconnect();
    };
  }, []);
};

export default useScrollAnimation;
