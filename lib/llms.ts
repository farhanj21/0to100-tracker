import "server-only";
import { carFullTitle, formatGap, formatTime } from "@/lib/utils";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  carPath,
  carSpecLine,
} from "@/lib/seo";
import type { CarDTO } from "@/lib/types";

/**
 * /llms.txt and /llms-full.txt (https://llmstxt.org): the board as plain
 * Markdown, so AI assistants and answer engines can read the rankings without
 * running the client-side leaderboard.
 */

export const LLMS_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  // Short CDN cache: crawlers hit it rarely, and edits show up within minutes.
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
};

/** Keep free-form values on one Markdown line. */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function lastUpdated(cars: CarDTO[]): string | null {
  const latest = cars.reduce<string | null>(
    (max, c) => (!max || c.updatedAt > max ? c.updatedAt : max),
    null
  );
  return latest ? latest.slice(0, 10) : null;
}

function intro(cars: CarDTO[]): string {
  const updated = lastUpdated(cars);
  const leader = cars[0];
  return [
    `${SITE_NAME} is an acceleration leaderboard. Every car on it has one 0–100 km/h time in seconds (lower is quicker), and its position is derived from that time on every request, so the ranking is always current.`,
    leader
      ? `There are ${cars.length} cars on the board; the quickest is the ${carFullTitle(leader)} at ${formatTime(leader.zeroToHundred)} s.` +
        (updated ? ` Last updated ${updated}.` : "")
      : "The board is currently empty.",
  ].join(" ");
}

export function buildLlmsTxt(cars: CarDTO[]): string {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    intro(cars),
    "",
    "## Board",
    "",
    `- [Leaderboard](${absoluteUrl("/")}): Every car ranked by 0–100 km/h time, quickest first.`,
    `- [By the Numbers](${absoluteUrl("/numbers")}): The field in aggregate — distribution, breakdowns and records.`,
    `- [Full data](${absoluteUrl("/llms-full.txt")}): Every car's complete spec sheet, features and notes in one Markdown file.`,
    "",
    "## Rankings",
    "",
    ...cars.map((car) => {
      const spec = carSpecLine(car);
      return `${car.position}. [${carFullTitle(car)}](${absoluteUrl(carPath(car))}): ${formatTime(car.zeroToHundred)} s${spec ? ` — ${spec}` : ""}`;
    }),
    "",
    "## Optional",
    "",
    `- [Compare](${absoluteUrl("/compare")}): Two or three cars head to head — pass car slugs as \`/compare?cars=slug-a,slug-b\`.`,
    `- [Race](${absoluteUrl("/race?all=1")}): The whole field running 0–100 km/h side by side, in real time.`,
  ];
  return lines.join("\n") + "\n";
}

export function buildLlmsFullTxt(cars: CarDTO[]): string {
  const total = cars.length;
  const sections = cars.map((car) => {
    const gap = formatGap(car.zeroToHundred - cars[0].zeroToHundred);
    const facts: [string, string | undefined][] = [
      ["URL", absoluteUrl(carPath(car))],
      ["Rank", `${car.position} of ${total}`],
      ["0–100 km/h", `${formatTime(car.zeroToHundred)} s`],
      ["Gap to leader", gap === "—" ? undefined : `${gap} s`],
      ["Model year", String(car.modelYear)],
      ["Manufacturer", car.manufacturer],
      ["Model", car.carModel],
      ["Variant", car.variant || undefined],
      ["Engine", car.engineSize ? `${car.engineSize.toFixed(1)} L` : undefined],
      ["Fuel type", car.fuelType],
      ["Powertrain", car.powertrainType],
      ["Induction", car.induction],
      ["Transmission", car.transmission],
    ];

    const out = [
      `## ${car.position}. ${carFullTitle(car)} — ${formatTime(car.zeroToHundred)} s`,
      "",
      ...facts
        .filter((f): f is [string, string] => Boolean(f[1]))
        .map(([label, value]) => `- ${label}: ${oneLine(value)}`),
    ];
    if (car.specs.length > 0) {
      out.push(
        "",
        "### Specifications",
        "",
        ...car.specs.map((s) => `- ${oneLine(s.label)}: ${oneLine(s.value)}`)
      );
    }
    if (car.features.length > 0) {
      out.push("", "### Features", "", ...car.features.map((f) => `- ${oneLine(f)}`));
    }
    if (car.notes.trim()) {
      // Quoted so headings or lists inside the notes can't break the outline.
      out.push(
        "",
        "### Notes",
        "",
        ...car.notes.trim().split(/\r?\n/).map((l) => (l ? `> ${l}` : ">"))
      );
    }
    return out.join("\n");
  });

  return (
    [
      `# ${SITE_NAME} — full board`,
      "",
      `> ${SITE_DESCRIPTION}`,
      "",
      intro(cars),
      "",
      `Overview and page links: ${absoluteUrl("/llms.txt")}`,
      "",
      ...sections.flatMap((s) => [s, ""]),
    ]
      .join("\n")
      .trimEnd() + "\n"
  );
}
