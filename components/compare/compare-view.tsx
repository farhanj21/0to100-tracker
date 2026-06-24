import Link from "next/link";
import { Check } from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { cn, formatTime, formatEngine, carTitle, ordinal } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

type Cell = { text: string; best?: boolean };
type Row = { label: string; cells: Cell[] };

/**
 * Side-by-side comparison of 2–3 cars. Read-only and presentational: the data
 * (including each car's true global `position`) is supplied by the /compare
 * page. The objectively "better" cell per row — fastest 0–100, best rank — is
 * highlighted in the accent colour.
 */
export function CompareView({
  cars,
  total,
}: {
  cars: CarDTO[];
  /** Total cars on the board, for "Nth of total" rank context. */
  total: number;
}) {
  const fastest = Math.min(...cars.map((c) => c.zeroToHundred));
  const bestRank = Math.min(...cars.map((c) => c.position));

  const coreRows: Row[] = [
    {
      label: "0–100 km/h",
      cells: cars.map((c) => ({
        text: `${formatTime(c.zeroToHundred)} s`,
        best: c.zeroToHundred === fastest,
      })),
    },
    {
      label: "Rank",
      cells: cars.map((c) => ({
        text: `${ordinal(c.position)} of ${total}`,
        best: c.position === bestRank,
      })),
    },
    { label: "Powertrain", cells: cars.map((c) => ({ text: c.powertrainType })) },
    { label: "Induction", cells: cars.map((c) => ({ text: c.induction })) },
    { label: "Transmission", cells: cars.map((c) => ({ text: c.transmission })) },
    { label: "Engine", cells: cars.map((c) => ({ text: formatEngine(c.engineSize) })) },
    { label: "Model year", cells: cars.map((c) => ({ text: String(c.modelYear) })) },
  ];

  // Union of extended-spec labels across the selected cars, in first-seen order.
  const specLabels: string[] = [];
  for (const car of cars) {
    for (const spec of car.specs) {
      if (!specLabels.includes(spec.label)) specLabels.push(spec.label);
    }
  }
  const specRows: Row[] = specLabels.map((label) => ({
    label,
    cells: cars.map((c) => ({
      text: c.specs.find((s) => s.label === label)?.value ?? "—",
    })),
  }));

  const hasFeatures = cars.some((c) => c.features.length > 0);

  return (
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[460px] border-collapse sm:min-w-[640px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-20 bg-card sm:w-40" />
            {cars.map((car) => (
              <th
                key={car.id}
                className="border-l border-border p-2.5 align-top sm:p-4"
                style={{ width: `${80 / cars.length}%` }}
              >
                <Link href={`/cars/${car.slug}`} className="group block text-left">
                  <CarThumb
                    car={car}
                    transform={{ w: 320, h: 200 }}
                    interactive
                    className="aspect-[16/10] w-full rounded-none bg-secondary ring-1 ring-border"
                  />
                  <span className="mt-2 inline-block bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary-foreground sm:mt-3 sm:px-2 sm:text-[10px]">
                    No.{String(car.position).padStart(2, "0")}
                  </span>
                  <p className="mt-1.5 font-display text-base leading-tight transition-colors group-hover:text-primary sm:mt-2 sm:text-xl">
                    {car.manufacturer}{" "}
                    <span className="text-muted-foreground">
                      {car.carModel}
                      {car.variant ? ` ${car.variant}` : ""}
                    </span>
                  </p>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SectionRow span={cars.length + 1}>Specs</SectionRow>
          {coreRows.map((row) => (
            <DataRow key={row.label} row={row} />
          ))}

          {specRows.length > 0 && (
            <>
              <SectionRow span={cars.length + 1}>Full specifications</SectionRow>
              {specRows.map((row) => (
                <DataRow key={row.label} row={row} />
              ))}
            </>
          )}

          {hasFeatures && (
            <>
              <SectionRow span={cars.length + 1}>Features</SectionRow>
              <tr className="border-t border-border">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card px-2.5 py-2.5 text-left align-top font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:px-4 sm:py-3 sm:text-[11px]"
                >
                  Features
                </th>
                {cars.map((car) => (
                  <td
                    key={car.id}
                    className="border-l border-border px-2.5 py-2.5 align-top sm:px-4 sm:py-3"
                  >
                    {car.features.length > 0 ? (
                      <ul className="space-y-1.5">
                        {car.features.map((f, i) => (
                          <li
                            key={`${f}-${i}`}
                            className="flex items-start gap-1.5 text-sm"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SectionRow({
  span,
  children,
}: {
  span: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={span}
        className="border-y border-border bg-secondary/40 px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:px-4 sm:text-[11px] sm:tracking-[0.22em]"
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-1.5 bg-primary" />
          {children}
        </span>
      </td>
    </tr>
  );
}

function DataRow({ row }: { row: Row }) {
  return (
    <tr className="border-t border-border">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-card px-2.5 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:px-4 sm:py-3 sm:text-[11px] sm:tracking-[0.14em]"
      >
        {row.label}
      </th>
      {row.cells.map((cell, i) => (
        <td
          key={i}
          className={cn(
            "border-l border-border px-2.5 py-2.5 text-[13px] sm:px-4 sm:py-3 sm:text-sm",
            cell.best
              ? "bg-primary/5 font-semibold text-primary"
              : "font-medium"
          )}
        >
          {cell.text}
        </td>
      ))}
    </tr>
  );
}
