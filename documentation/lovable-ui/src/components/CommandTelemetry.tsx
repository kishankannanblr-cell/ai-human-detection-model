import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Stage = "capture" | "inference" | "relay" | "callout";

const LATENCY: Array<Record<Stage | "frame", number | string>> = [
  { frame: "F-01", capture: 22, inference: 84, relay: 610, callout: 34 },
  { frame: "F-02", capture: 19, inference: 91, relay: 720, callout: 28 },
  { frame: "F-03", capture: 24, inference: 78, relay: 540, callout: 41 },
  { frame: "F-04", capture: 21, inference: 88, relay: 690, callout: 32 },
  { frame: "F-05", capture: 23, inference: 96, relay: 640, callout: 37 },
  { frame: "F-06", capture: 20, inference: 82, relay: 590, callout: 29 },
  { frame: "F-07", capture: 22, inference: 79, relay: 660, callout: 33 },
  { frame: "F-08", capture: 25, inference: 101, relay: 750, callout: 42 },
];

const CONFIDENCE = Array.from({ length: 24 }).map((_, i) => ({
  t: i,
  label: `t+${i}s`,
  conf: Math.round((0.62 + Math.sin(i / 2.6) * 0.14 + (i % 5) * 0.02) * 100) / 100,
  threshold: 0.75,
}));

const STAGE_META: Record<Stage, { label: string; color: string }> = {
  capture: { label: "Capture", color: "rgb(124,196,255)" },
  inference: { label: "Inference", color: "rgb(255,106,61)" },
  relay: { label: "Relay", color: "rgb(180,240,120)" },
  callout: { label: "Callout", color: "rgb(200,120,255)" },
};

const TOOLTIP_STYLE = {
  background: "rgba(10,10,14,0.95)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  fontFamily: "ui-monospace, monospace",
  fontSize: 11,
};

export function CommandTelemetry() {
  const [hidden, setHidden] = useState<Set<Stage>>(new Set());
  const toggle = (s: Stage) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const stages: Stage[] = ["capture", "inference", "relay", "callout"];
  const totalByStage = useMemo(() => {
    const totals: Record<Stage, number> = {
      capture: 0,
      inference: 0,
      relay: 0,
      callout: 0,
    };
    LATENCY.forEach((row) => {
      stages.forEach((s) => (totals[s] += row[s] as number));
    });
    return totals;
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Latency */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-widest">
          <span className="text-ember">Latency breakdown · ms per stage</span>
          <span className="text-muted-foreground">click legend to toggle</span>
        </div>
        <div className="flex flex-wrap gap-2 px-5 pt-3">
          {stages.map((s) => {
            const off = hidden.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition ${
                  off
                    ? "border-white/10 text-muted-foreground line-through"
                    : "border-white/20 text-foreground"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STAGE_META[s].color, opacity: off ? 0.3 : 1 }}
                />
                {STAGE_META[s].label} · {totalByStage[s]}ms
              </button>
            );
          })}
        </div>
        <div className="h-64 px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={LATENCY}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="frame"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                unit="ms"
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "rgb(255,106,61)" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
              />
              {stages.map((s) =>
                hidden.has(s) ? null : (
                  <Bar
                    key={s}
                    dataKey={s}
                    stackId="lat"
                    fill={STAGE_META[s].color}
                    name={STAGE_META[s].label}
                  />
                ),
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-widest">
          <span className="text-ember">Confidence · rolling 24s</span>
          <span className="text-muted-foreground">drag brush to zoom</span>
        </div>
        <div className="h-64 px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CONFIDENCE}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
              />
              <YAxis
                domain={[0.4, 1]}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "rgb(124,196,255)" }}
              />
              <ReferenceLine
                y={0.75}
                stroke="rgb(255,106,61)"
                strokeDasharray="4 3"
                label={{
                  value: "IC threshold",
                  fill: "rgb(255,106,61)",
                  fontSize: 10,
                  fontFamily: "ui-monospace, monospace",
                  position: "insideTopRight",
                }}
              />
              <Line
                type="monotone"
                dataKey="conf"
                stroke="rgb(124,196,255)"
                strokeWidth={2}
                dot={{ r: 2, fill: "rgb(124,196,255)" }}
                activeDot={{ r: 5 }}
                name="Confidence"
              />
              <Brush
                dataKey="label"
                height={20}
                stroke="rgba(124,196,255,0.5)"
                fill="rgba(124,196,255,0.08)"
                travellerWidth={8}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
