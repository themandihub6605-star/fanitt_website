import { useRef } from 'react';
import { useScroll, useTransform, type MotionValue } from 'framer-motion';

/**
 * Attaches to a section wrapper and returns a `y` MotionValue that drifts
 * as the section scrolls through the viewport — used to give background
 * decoration (blobs, photos, gradients) a subtle parallax depth across
 * the whole site, without moving foreground text/content.
 *
 * `speed` > 0 moves slower than scroll (background feel).
 * `speed` < 0 moves opposite to scroll (foreground/pop feel).
 */
export function useParallax(speed = 40) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y: MotionValue<number> = useTransform(scrollYProgress, [0, 1], [-speed, speed]);
  return { ref, y };
}
