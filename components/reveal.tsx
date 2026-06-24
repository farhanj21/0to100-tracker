"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Fades a block up into place the first time it scrolls into view — the same
 * restrained entrance the board rows use, reused to give the numbers page life
 * as you read down it. Reduced-motion gets a plain fade, no transform.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={
        reduce
          ? { duration: 0.2, delay }
          : { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }
      }
    >
      {children}
    </motion.div>
  );
}
