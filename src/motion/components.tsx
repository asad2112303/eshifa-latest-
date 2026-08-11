import React, { ReactNode } from "react";
import { motion, type TargetAndTransition } from "framer-motion";
import { DURATION, EASE_OUT, VIEWPORT_ONCE } from "./transitions";
import { pageTransition } from "./variants";

/**
 * Reusable motion wrapper components.
 * These are the only places framer-motion scroll-reveal wiring should live —
 * pages compose these instead of hand-rolling motion.div everywhere.
 */

type RevealDirection = "up" | "left" | "right" | "scale";

/* Transition-free offsets so the component-level `transition` (incl. delay) applies. */
const directionOffset: Record<RevealDirection, TargetAndTransition> = {
  up: { y: 24 },
  left: { x: -32 },
  right: { x: 32 },
  scale: { scale: 0.96 },
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in milliseconds (kept in ms for backwards compatibility with the previous Reveal API). */
  delay?: number;
  direction?: RevealDirection;
}

/**
 * Scroll reveal: fades content in the first time it enters the viewport.
 * Drop-in replacement for the old IntersectionObserver-based Reveal.
 */
export const Reveal = ({ children, className = "", delay = 0, direction = "up" }: RevealProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, ...directionOffset[direction] }}
    whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
    viewport={VIEWPORT_ONCE}
    transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: delay / 1000 }}
  >
    {children}
  </motion.div>
);

/** Route-level wrapper providing enter/exit transitions. Key it by location. */
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

/**
 * Word-by-word headline reveal for hero headings.
 * Renders inside an existing <h1>/<h2>; words wrap naturally.
 * Must be a descendant of a variants container (it inherits the parent's stagger).
 */
export const AnimatedWords = ({ text, stagger = 0.06 }: { text: string; stagger?: number }) => (
  <motion.span
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: stagger } },
    }}
  >
    {text.split(" ").map((word, i) => (
      <React.Fragment key={`${word}-${i}`}>
        <motion.span
          className="inline-block will-change-transform"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
          }}
        >
          {word}
        </motion.span>{" "}
      </React.Fragment>
    ))}
  </motion.span>
);
