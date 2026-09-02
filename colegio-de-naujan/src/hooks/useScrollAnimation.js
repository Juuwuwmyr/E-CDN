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

    
    checkElements();

    window.addEventListener('scroll', onScroll, { passive: true });

    
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
