import type { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import { useParallax } from '@/hooks/useParallax';

interface ParallaxItemProps {
  speed?: number;
  className?: string;
}

/** Wraps a grid/list item so it drifts at its own scroll speed - used to give
 * grids (creators, categories, sessions) a real layered parallax feel, not
 * just decorative background blobs. */
export function ParallaxItem({ speed = 18, className, children }: PropsWithChildren<ParallaxItemProps>) {
  const { ref, y } = useParallax(speed);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
