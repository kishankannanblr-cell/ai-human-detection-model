import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { TelemetryTag } from "./TelemetryTag";

export function HeroFuturistic() {
  return (
    <section className="relative mx-auto mt-6 max-w-[1400px] px-4 sm:px-6">
      <div className="panel-outer relative overflow-hidden px-6 pb-16 pt-28 md:px-12 md:pb-24 md:pt-32">
        {/* blooms */}
        <div className="pointer-events-none absolute -right-24 -top-20 h-[520px] w-[620px] bloom-ice" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[520px] bloom-ember opacity-60" />
        {/* starfield */}
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,oklch(1_0_0_/_0.08)_1px,transparent_0)] [background-size:22px_22px] opacity-50" />

        {/* corner telemetry */}
        <div className="pointer-events-none absolute left-6 top-24 hidden md:block">
          <TelemetryTag
            label="YOLOv8 Vision"
            value="47 FPS · 0.94 mAP"
            icon="◎"
            accent="ember"
          />
        </div>
        <div className="pointer-events-none absolute right-6 top-24 hidden md:block">
          <TelemetryTag
            label="Humans detected"
            value="3 · in smoke"
            icon="◉"
            accent="ice"
            align="right"
          />
        </div>
        <div className="pointer-events-none absolute left-6 bottom-32 hidden md:block">
          <TelemetryTag
            label="Priority queue"
            value="P1 · SAR + Suppression"
            icon="≋"
            accent="ice"
          />
        </div>
        <div className="pointer-events-none absolute right-6 bottom-32 hidden md:block">
          <TelemetryTag
            label="Relay → IC"
            value="740 ms · mesh 92%"
            icon="↗"
            accent="signal"
            align="right"
          />
        </div>

        {/* center content */}
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <Link
            to="/detection"
            className="glass-panel inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-ember/30 text-ember text-[10px]">◉</span>
            See the detection loop
            <span>→</span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mt-6 text-[44px] font-medium leading-[0.98] tracking-tight md:text-[88px]"
          >
            One model.{" "}
            <span className="text-foreground/40">Every life ranked.</span>
          </motion.h1>

          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            AI vision on a firefighting drone — finding humans through smoke
            and building debris with YOLO, then ranking every room P1 → P5
            for the incident commander in under a second.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/command"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-background transition hover:bg-foreground/90"
            >
              Open Console ↗
            </Link>
            <Link
              to="/detection"
              className="glass-panel inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-foreground transition hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* bottom row */}
        <div className="relative mt-16 flex items-end justify-between">
          <div className="glass-panel flex items-center gap-3 rounded-full px-3 py-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-foreground">
              ↓
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              01 / 05 · Scroll down
            </span>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Active mission
              <div className="text-foreground/90">Wildfire · Sector C</div>
            </div>
            <div className="flex gap-1">
              <span className="h-1 w-10 rounded-full bg-foreground/70" />
              <span className="h-1 w-6 rounded-full bg-white/15" />
              <span className="h-1 w-6 rounded-full bg-white/15" />
              <span className="h-1 w-6 rounded-full bg-white/15" />
              <span className="h-1 w-6 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
