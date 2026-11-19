import { useEffect, useRef } from 'react';

/**
 * useMagneticProximity
 * Adds a very subtle magnetic response when a fine pointer comes within ~30px of the button.
 * Capped strictly at 3px in any direction.
 * Uses CSS custom properties (--mag-x, --mag-y) directly on the DOM element
 * to guarantee 0 React re-renders and flawless composeability with hover/press transforms.
 * Disables automatically for touch devices or if prefers-reduced-motion is active.
 */
export function useMagneticProximity<T extends HTMLElement>() {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined') return;

    // Check for fine pointer and user preference for reduced motion
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      return;
    }

    const PROXIMITY_THRESHOLD = 30; // 30px buffer around button
    const MAX_DISPLACEMENT = 3;     // Cap at 3px in any direction

    let isInside = false;

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Distance from button bounding box edges
      const distX =
        e.clientX < rect.left
          ? rect.left - e.clientX
          : e.clientX > rect.right
          ? e.clientX - rect.right
          : 0;

      const distY =
        e.clientY < rect.top
          ? rect.top - e.clientY
          : e.clientY > rect.bottom
          ? e.clientY - rect.bottom
          : 0;

      const distance = Math.hypot(distX, distY);

      if (distance <= PROXIMITY_THRESHOLD) {
        isInside = true;
        // Direction vector normalized by boundary
        const normX = (e.clientX - cx) / (rect.width / 2 + PROXIMITY_THRESHOLD);
        const normY = (e.clientY - cy) / (rect.height / 2 + PROXIMITY_THRESHOLD);

        const magX = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, normX * MAX_DISPLACEMENT));
        const magY = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, normY * MAX_DISPLACEMENT));

        el.style.setProperty('--mag-x', `${magX.toFixed(2)}px`);
        el.style.setProperty('--mag-y', `${magY.toFixed(2)}px`);
      } else if (isInside) {
        isInside = false;
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
      }
    };

    const onPointerLeaveWindow = () => {
      if (isInside) {
        isInside = false;
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeaveWindow, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeaveWindow);
      if (el) {
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
      }
    };
  }, []);

  return elementRef;
}
