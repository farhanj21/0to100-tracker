import type { Metadata } from "next";
import { Instrument_Serif, Archivo, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { ChatAssistant } from "@/components/chat/chat-assistant";

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
        <footer className="mt-1 border-t border-border/60">
          {/* Grid drives both layouts without duplicating content. Mobile rows:
              "sign-off | built-by" then a centered colophon spanning both cols.
              Desktop: sign-off spans both rows on the left, credits stack right. */}
          <div className="container grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-6 [grid-template-areas:'signoff_builtby'] sm:[grid-template-areas:'signoff_builtby'_'signoff_colophon']">
            {/* Editorial sign-off */}
            <p className="font-display text-2xl tracking-tight [grid-area:signoff] sm:text-3xl">
              Quickest <span className="italic">first</span>
              <span className="text-primary">.</span>
            </p>

            {/* Credits — right of the sign-off on every breakpoint */}
            <span className="flex items-center gap-1.5 justify-self-end text-xs text-muted-foreground [grid-area:builtby]">
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

            {/* Colophon — hidden on mobile, right-aligned under the credits on desktop */}
            <span className="hidden font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground/60 [grid-area:colophon] sm:block sm:justify-self-end sm:text-right">
              0–100 · Acceleration board · {new Date().getFullYear()}
            </span>
          </div>
        </footer>
        <ChatAssistant />
        <Toaster />
      </body>
    </html>
  );
}
