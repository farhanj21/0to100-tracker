"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Signature, firstSignature, secondSignature } from "./signature";

export function FooterCredits() {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  return (
    <span
      ref={ref}
      className="col-start-2 flex items-center justify-center gap-2 text-xs text-muted-foreground"
    >
      Built by
      <a
        href="https://github.com/farhanj21"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground/80 hover:text-primary transition-colors"
        aria-label="Vroslmend"
      >
        <Signature isInView={isInView} data={secondSignature} />
      </a>
      <span className="text-muted-foreground/50">&</span>

            <a
        href="https://github.com/vroslmend"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground/80 hover:text-primary transition-colors"
        aria-label="Kensu"
      >
        <Signature isInView={isInView} data={firstSignature} />
      </a>
    </span>
  );
}
