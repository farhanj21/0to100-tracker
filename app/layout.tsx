import type { Metadata } from "next";
import { Instrument_Serif, Archivo, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "0–100 · Acceleration Board",
  description:
    "A live ranking of cars by their 0–100 km/h time, quickest first.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=t? t==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
        />
      </head>
      <body
        className={`${instrumentSerif.variable} ${archivo.variable} ${spaceMono.variable} font-sans min-h-screen`}
      >
        <div className="grain" aria-hidden />
        <SiteHeader />
        <main className="container py-8">{children}</main>
        <footer className="mt-16 border-t border-border/60">
          <div className="container flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Editorial sign-off */}
            <p className="font-display text-2xl tracking-tight sm:text-3xl">
              Quickest <span className="italic">first</span>
              <span className="text-primary">.</span>
            </p>

            {/* Credits + colophon */}
            <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:items-end">
              <span className="flex items-center gap-1.5">
                Built by
                <a
                  href="https://github.com/farhanj21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/80 transition-colors hover:text-primary"
                >
                  Kensu
                </a>
                <span className="text-muted-foreground/50">&</span>
                <a
                  href="https://github.com/vroslmend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/80 transition-colors hover:text-primary"
                >
                  Vroslmend
                </a>
              </span>
              <span className="font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
                0–100 · Acceleration board · {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
