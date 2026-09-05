import { useEffect } from 'react';

const useScrollAnimation = () => {
  useEffect(() => {
    let rafId;

    const checkElements = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      const windowHeight = window.innerHeight;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < windowHeight - 60 && rect.bottom > 0;

        if (inView) {
          el.classList.add('is-visible');
        } else {
          el.classList.remove('is-visible');
        }
      });
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkElements);
    };

    // Run after paint so elements are fully laid out
    const initialRaf = requestAnimationFrame(() => {
      checkElements();
    });

    // Also run after a short delay to catch elements rendered after first paint
    const timer = setTimeout(checkElements, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkElements, { passive: true });

    const mo = new MutationObserver(() => checkElements());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', checkElements);
      cancelAnimationFrame(initialRaf);
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      mo.disconnect();
    };
  }, []);
};

export default useScrollAnimation;
