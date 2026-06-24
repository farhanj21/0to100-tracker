"use client";

import { useState } from "react";
import { DistributionPlot } from "@/components/leaderboard/distribution-plot";
import type { CarDTO } from "@/lib/types";

/**
 * The dot-plot for the /numbers page, where there's no board to sync with — it
 * owns its own hover state so the beeswarm is still interactive standalone.
 */
export function StaticDistribution({
  cars,
  domain,
  leaderId,
}: {
  cars: CarDTO[];
  domain: [number, number];
  leaderId: string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <DistributionPlot
      cars={cars}
      domain={domain}
      leaderId={leaderId}
      hoveredId={hoveredId}
      onHover={setHoveredId}
    />
  );
}
