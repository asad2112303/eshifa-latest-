"use client";

import type { Transition } from "framer-motion";

/**
 * Centralized motion timing system.
 * All durations/easings/springs used across the site live here —
 * never hardcode timing values inside components.
 */

export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

/** Premium ease-out curve (Apple/Linear-style controlled deceleration). */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Ease-in used for exits — content leaves quickly without drawing attention. */
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 32,
  mass: 1,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

export const springSmooth: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 40,
  mass: 1,
};

/**
 * Shared whileInView viewport config: reveal once, slightly before fully on screen.
 *
 * `amount: "some"` rather than a fraction. A fraction is measured against the
 * *element*, so a container taller than roughly 5x the viewport can never
 * satisfy `amount: 0.2` — on mobile the Specialized Care Programs grid is ~4.9x
 * the screen, so its cards stayed at opacity 0 and never appeared. "some" fires
 * as soon as any part enters, which is correct at every container height.
 */
export const VIEWPORT_ONCE = {
  once: true,
  amount: "some",
  margin: "0px 0px -50px 0px",
} as const;
