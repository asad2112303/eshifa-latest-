import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getServiceIcon } from "@/lib/service-icons";
import { springSnappy } from "@/motion/transitions";

/**
 * Renders the icon for a given service, optionally inside a styled container.
 *
 * Accessibility: icons here are decorative — every call site also renders the
 * service name as visible text. The svg is therefore hidden from assistive tech
 * unless an explicit `label` is passed.
 */

type ServiceIconVariant = "bare" | "tile" | "chip";

const containerSizes: Record<Exclude<ServiceIconVariant, "bare">, string> = {
  tile: "w-20 h-20 sm:w-24 sm:h-24 rounded-[28px]",
  chip: "w-12 h-12 rounded-xl",
};

export interface ServiceIconProps {
  /** Service display name or slug — resolved via the central icon map. */
  service: string;
  /** Icon glyph size in px. */
  size?: number;
  strokeWidth?: number;
  variant?: ServiceIconVariant;
  className?: string;
  /** Class applied to the container (tile/chip variants only). */
  containerClassName?: string;
  /** Provide only when the icon carries meaning not already in nearby text. */
  label?: string;
  /** Scale the icon up when an ancestor with `group` is hovered. */
  interactive?: boolean;
}

export function ServiceIcon({
  service,
  size = 32,
  strokeWidth = 1.5,
  variant = "bare",
  className,
  containerClassName,
  label,
  interactive = false,
}: ServiceIconProps) {
  const Icon = getServiceIcon(service);

  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };

  const glyph = (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", interactive && "transition-transform duration-200 group-hover:scale-105", className)}
      {...a11y}
    />
  );

  if (variant === "bare") return glyph;

  return (
    <motion.div
      whileHover={interactive ? { y: -2 } : undefined}
      transition={springSnappy}
      className={cn(
        "flex items-center justify-center border border-[#E8E8E8] bg-white text-[#0289E8] shadow-sm",
        "transition-shadow duration-200",
        interactive && "group-hover:shadow-md",
        containerSizes[variant],
        containerClassName,
      )}
    >
      {glyph}
    </motion.div>
  );
}
