import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";

export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  label,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setN(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <div ref={ref}>
      <div className="font-display text-4xl font-medium text-signal md:text-5xl">
        {prefix}
        {n.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
