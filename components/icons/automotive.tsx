/** Automotive glyphs backed by the PNGs in /public/icons.
 *
 *  The source art is solid black line-work, but the rows render on a dark
 *  surface in muted text colour. Drawing each PNG as a CSS mask filled with
 *  `currentColor` lets them inherit the surrounding text colour exactly the way
 *  the lucide icons do, so sizing (`h-3 w-3`) and theming stay consistent. */
function MaskIcon({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

/** Engine block — for ICE powertrains, in place of the generic bolt. */
export function Engine({ className }: { className?: string }) {
  return <MaskIcon src="/icons/engine_icon.png" className={className} />;
}

/** Turbocharger — for turbocharged induction. */
export function Turbo({ className }: { className?: string }) {
  return <MaskIcon src="/icons/turbo_icon.png" className={className} />;
}
