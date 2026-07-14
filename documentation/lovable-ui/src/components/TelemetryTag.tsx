import type { ReactNode } from "react";

export function TelemetryTag({
  label,
  value,
  icon,
  align = "left",
  accent = "ember",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  align?: "left" | "right";
  accent?: "ember" | "ice" | "signal";
}) {
  const color =
    accent === "ice"
      ? "text-ice"
      : accent === "signal"
      ? "text-signal"
      : "text-ember";
  return (
    <div
      className={`flex items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div
        className={`grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/40 ${color}`}
      >
        {icon ?? "●"}
      </div>
      <div>
        <div className="text-sm text-foreground/90">{label}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}
