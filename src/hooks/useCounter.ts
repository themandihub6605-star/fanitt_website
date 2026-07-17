import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 to `target` once `start` becomes true.
 */
export function useCounter(target: number, start: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let frame: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return value;
}
