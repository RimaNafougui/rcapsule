import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export const metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <section className="relative flex flex-col items-center justify-between min-h-[90vh] px-6 py-12 text-center overflow-hidden">
      {/* Grid background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--heroui-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--heroui-foreground)) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
        }}
      />

      {/* Brand mark — top */}
      <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-default-400">
        rcapsule
      </p>

      {/* Main content — vertically centered */}
      <div className="flex flex-col items-center w-full">
        {/* 404 */}
        <div className="w-full flex justify-center">
          <h1 className="text-[clamp(7rem,25vw,18rem)] font-display font-light tracking-normal leading-none select-none">
            404
          </h1>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-default-300 my-8" />

        {/* Subtitle */}
        <p className="text-[clamp(1.5rem,4vw,2.5rem)] font-display font-light tracking-normal leading-tight mb-4 max-w-lg">
          This page went out of style.
        </p>

        <p className="text-default-400 text-sm max-w-xs leading-relaxed mb-12">
          The look you&apos;re searching for doesn&apos;t exist — or maybe it
          never did.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            className="inline-flex items-center justify-center gap-2 px-8 h-12 bg-foreground text-background text-xs font-display font-light tracking-normal hover:opacity-80 transition-opacity"
            href="/"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 px-8 h-12 border-2 border-foreground text-foreground text-xs font-display font-light tracking-normal hover:bg-foreground hover:text-background transition-colors"
            href="/discover"
          >
            <Compass size={14} />
            Explore Looks
          </Link>
        </div>
      </div>

      {/* Bottom tag — in flow, no overlap */}
      <p className="text-[10px] uppercase tracking-[0.3em] text-default-300">
        Error 404 · Page Not Found
      </p>
    </section>
  );
}
