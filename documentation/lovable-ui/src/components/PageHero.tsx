import type { ReactNode } from "react";

export function PageHero({
  chapter,
  title,
  lede,
  meta,
}: {
  chapter: string;
  title: ReactNode;
  lede: string;
  meta?: ReactNode;
}) {
  return (
    <section className="relative mx-auto max-w-[1400px] px-6 pt-16 md:pt-24">
      <div className="glass-panel relative overflow-hidden rounded-2xl px-6 py-10 md:px-12 md:py-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-[340px] w-[420px] bloom-ice opacity-70" />
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
          {chapter}
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-medium leading-[1.05] md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          {lede}
        </p>
        {meta && (
          <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
    </section>
  );
}
