import * as React from "react";

/**
 * Custom outline icons for medical equipment that the Lucide set does not
 * represent meaningfully. These deliberately match Lucide's drawing contract so
 * they sit alongside library icons without any visual seam:
 *
 *   viewBox="0 0 24 24" · fill="none" · stroke="currentColor"
 *   strokeWidth default 2 · round caps and joins
 *
 * No hardcoded brand colour — colour always comes from the parent via
 * `currentColor`, so these theme exactly like Lucide icons do.
 */

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

export const withBase = (
  displayName: string,
  paths: React.ReactNode,
): React.ForwardRefExoticComponent<CustomIconProps & React.RefAttributes<SVGSVGElement>> => {
  const Icon = React.forwardRef<SVGSVGElement, CustomIconProps>(
    ({ size = 24, strokeWidth = 2, ...props }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      />
    ),
  );
  Icon.displayName = displayName;

  // Wrap so children render inside the shared <svg> shell.
  const Wrapped = React.forwardRef<SVGSVGElement, CustomIconProps>((props, ref) => (
    <Icon ref={ref} {...props}>
      {paths}
    </Icon>
  ));
  Wrapped.displayName = displayName;
  return Wrapped;
};

/** Oxygen concentrator / cylinder — tank body with valve neck and regulator. */
export const OxygenCylinder = withBase(
  "OxygenCylinder",
  <>
    <path d="M7 12a5 5 0 0 1 10 0v6a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" />
    <path d="M10 8V5a2 2 0 1 1 4 0v3" />
    <path d="M12 13v4" />
    <path d="M10 15h4" />
  </>,
);

/** Nebulizer — medication chamber with aerosol mist rising from it. */
export const Nebulizer = withBase(
  "Nebulizer",
  <>
    <path d="M6 12h12l-1.4 7.2a2 2 0 0 1-2 1.8h-5.2a2 2 0 0 1-2-1.8Z" />
    <path d="M9 9c0-1.6 1.5-1.6 1.5-3.2S9 4.2 9 2.6" />
    <path d="M14 9c0-1.6 1.5-1.6 1.5-3.2S14 4.2 14 2.6" />
  </>,
);

/** Suction machine — collection canister with suction tube drawing away. */
export const SuctionPump = withBase(
  "SuctionPump",
  <>
    <rect x="3" y="11" width="11" height="10" rx="2" />
    <path d="M3 16h11" />
    <path d="M9 11V8a3 3 0 0 1 3-3h5" />
    <path d="m15 3 2 2-2 2" />
  </>,
);

/** BiPAP / CPAP — pressure mask with headgear straps and air tube. */
export const CpapMask = withBase(
  "CpapMask",
  <>
    <path d="M8 7h8a3 3 0 0 1 3 3v1a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-1a3 3 0 0 1 3-3Z" />
    <path d="M5 10H2" />
    <path d="M19 10h3" />
    <path d="M12 16v3" />
    <path d="M10 21h4" />
  </>,
);
