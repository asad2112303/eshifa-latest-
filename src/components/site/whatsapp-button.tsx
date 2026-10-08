"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { whatsappUrl } from "@/lib/site-config";
import { trackEvent } from "@/lib/analytics";

/**
 * Floating WhatsApp button, bottom-right on every public page.
 *
 * WhatsApp is how most patients in Pakistan already message businesses, so a
 * chat that is one tap away from any page lowers the bar below the callback
 * form. It is a round icon only: the WhatsApp mark is universally recognised,
 * a text label would crowd the thumb zone on phones and cover page content on
 * desktop, and screen readers get the purpose from the aria-label.
 *
 * It sits below the navbar's layer so the open mobile menu covers it, and it
 * keeps clear of the iPhone home indicator through the safe-area inset.
 */
export function WhatsAppButton() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with eShifa on WhatsApp"
      onClick={() => trackEvent("whatsapp_click", { location: "floating_button" })}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-[#1DA851] hover:shadow-[0_10px_28px_rgba(37,211,102,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 motion-safe:hover:-translate-y-0.5 print:hidden sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <FaWhatsapp className="h-8 w-8" aria-hidden="true" />
    </motion.a>
  );
}
