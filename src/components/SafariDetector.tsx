'use client';

import { useEffect } from 'react';

export default function SafariDetector() {
  useEffect(() => {
    const isSafari =
      typeof navigator !== 'undefined' &&
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
      document.documentElement.classList.add('safari');
      document.body.classList.add('safari-pad');
      
      // Track header height for Safari fixed positioning
      const updateHeaderHeight = () => {
        const header = document.querySelector('header.site-header') as HTMLElement | null;
        if (header) {
          const height = header.offsetHeight;
          document.documentElement.style.setProperty('--header-h', `${height}px`);
        }
      };
      
      updateHeaderHeight();
      window.addEventListener('resize', updateHeaderHeight);
      
      // Also update after a short delay to ensure layout is complete
      const timeout = setTimeout(updateHeaderHeight, 100);
      
      return () => {
        window.removeEventListener('resize', updateHeaderHeight);
        clearTimeout(timeout);
      };
    }
  }, []);

  return null;
}

