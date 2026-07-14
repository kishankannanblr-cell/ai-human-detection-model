import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import detectionFrame from "../assets/detection-frame.jpg";
import { TacticalMap, type MapDetection } from "./TacticalMap";

type Status = "pending" | "confirmed" | "dismissed";

type Detection = {
  id: string;
  conf: number;
  bearing: number;
  dist: number;
  motion: "low" | "moving" | "still";
  arriveAt: number;
};

const SEED: Detection[] = [
  { id: "H-018", conf: 0.94, bearing: 41, dist: 38, motion: "low", arriveAt: 400 },
  { id: "H-019", conf: 0.88, bearing: 65, dist: 52, motion: "still", arriveAt: 2800 },
  { id: "H-020", conf: 0.91, bearing: 118, dist: 71, motion: "moving", arriveAt: 5200 },
  { id: "H-021", conf: 0.82, bearing: 202, dist: 44, motion: "moving", arriveAt: 8000 },
];

type StatusFilter = "all" | "pending" | "confirmed" | "dismissed";

function fmtTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `00:${m}:${s}`;
}

export function CommanderConsole() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [visible, setVisible] = useState<string[]>([]);
  const [decidedAt, setDecidedAt] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [callout, setCallout] = useState<{
    key: number;
    tone: "alert" | "ok" | "muted";
    text: string;
  }>({
    key: 0,
    tone: "muted",
    text: "Awaiting first detection from UAS-04…",
  });
  const calloutKey = useRef(0);
  const cycleStart = useRef(Date.now());
  const streamTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const pushCallout = (tone: "alert" | "ok" | "muted", text: string) => {
    calloutKey.current += 1;
    setCallout({ key: calloutKey.current, tone, text });
  };

  const startStream = () => {
    streamTimers.current.forEach(clearTimeout);
    streamTimers.current = [];
    cycleStart.current = Date.now();
    setStatuses({});
    setVisible([]);
    setDecidedAt({});
    pushCallout("muted", "Sweep in progress · UAS-04 advancing on sector C");
    SEED.forEach((d) => {
      streamTimers.current.push(
        setTimeout(() => {
          setVisible((v) => (v.includes(d.id) ? v : [...v, d.id]));
          setStatuses((s) => (s[d.id] ? s : { ...s, [d.id]: "pending" }));
          pushCallout(
            "alert",
            `New detection ${d.id} · bearing ${String(d.bearing).padStart(3, "0")}° · conf ${d.conf.toFixed(2)}`,
          );
        }, d.arriveAt),
      );
    });
  };

  useEffect(() => {
    startStream();
    return () => streamTimers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = (id: string, next: Status) => {
    setStatuses((s) => ({ ...s, [id]: next }));
    setDecidedAt((c) => ({ ...c, [id]: fmtTime(Date.now() - cycleStart.current) }));
    if (next === "confirmed") {
      pushCallout("ok", `${id} confirmed. Relayed to Eng-3, Truck-1.`);
      toast.success(`${id} dispatch confirmed`, {
        description: "Eng-3, Truck-1 routed to grid.",
      });
    } else {
      pushCallout("muted", `${id} dismissed — flagged for retraining.`);
      toast(`${id} dismissed`, {
        description: "Sent to model retraining queue.",
      });
    }
  };

  const reset = () => {
    startStream();
    toast.message("Drill reset", { description: "Streaming detections from t=0." });
  };

  const counts = useMemo(() => {
    let c = 0,
      d = 0,
      p = 0;
    visible.forEach((id) => {
      const s = statuses[id];
      if (s === "confirmed") c++;
      else if (s === "dismissed") d++;
      else p++;
    });
    return { all: visible.length, c, d, p };
  }, [visible, statuses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEED.filter((d) => visible.includes(d.id)).filter((d) => {
      const status = statuses[d.id] ?? "pending";
      if (filter !== "all" && status !== filter) return false;
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        d.motion.toLowerCase().includes(q) ||
        String(d.bearing).includes(q) ||
        "person".includes(q)
      );
    });
  }, [query, filter, visible, statuses]);

  const mapDetections: MapDetection[] = SEED.filter((d) => visible.includes(d.id)).map(
    (d) => ({
      id: d.id,
      bearing: d.bearing,
      dist: d.dist,
      conf: d.conf,
      status: statuses[d.id] ?? "pending",
    }),
  );

  const filters: { key: StatusFilter; label: string; tone: string }[] = [
    { key: "all", label: "All", tone: "text-foreground" },
    { key: "pending", label: "Pending", tone: "text-ember" },
    { key: "confirmed", label: "Confirmed", tone: "text-ice" },
    { key: "dismissed", label: "Dismissed", tone: "text-muted-foreground" },
  ];

  return (
    <div className="glass-panel grid gap-px overflow-hidden rounded-2xl bg-white/[0.04] lg:grid-cols-[1.4fr_1fr]">
      {/* Live tile */}
      <div className="relative bg-black">
        <img
          src={detectionFrame}
          alt="Incident commander live drone feed"
          width={1280}
          height={896}
          loading="lazy"
          className="block aspect-[4/3] w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-ember/40" />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-signal">
          <span className="pulse-dot" /> Live · UAS-04
        </div>
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          740 ms · mesh 92%
        </div>
        <div className="absolute inset-x-3 bottom-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={callout.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-panel flex items-center gap-3 rounded-xl px-3 py-2"
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-black ${
                  callout.tone === "alert"
                    ? "bg-ember"
                    : callout.tone === "ok"
                      ? "bg-ice"
                      : "bg-white/30"
                }`}
              >
                {callout.tone === "alert" ? "!" : callout.tone === "ok" ? "✓" : "·"}
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  IC callout
                </div>
                <div className="text-sm">{callout.text}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Detection queue + map */}
      <div className="flex flex-col bg-black/40">
        {/* Counters */}
        <div className="grid grid-cols-4 border-b border-white/10 font-mono text-[10px] uppercase tracking-widest">
          <div className="px-3 py-2.5">
            <div className="text-muted-foreground">Active</div>
            <div className="text-sm text-foreground">{counts.all}</div>
          </div>
          <div className="border-l border-white/10 px-3 py-2.5">
            <div className="text-muted-foreground">Pending</div>
            <div className="text-sm text-ember">{counts.p}</div>
          </div>
          <div className="border-l border-white/10 px-3 py-2.5">
            <div className="text-muted-foreground">Resolved</div>
            <div className="text-sm text-ice">{counts.c}</div>
          </div>
          <div className="border-l border-white/10 px-3 py-2.5">
            <div className="text-muted-foreground">Dismissed</div>
            <div className="text-sm text-muted-foreground">{counts.d}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, bearing, motion…"
            className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-ember/60 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest transition ${
                  filter === f.key
                    ? "border-ember/60 bg-ember/15 text-ember"
                    : `border-white/10 ${f.tone} hover:bg-white/5`
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="ml-auto rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-white/5"
            >
              ↻ Reset drill
            </button>
          </div>
        </div>

        <ul className="min-h-[8rem] divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {filtered.map((d) => {
              const status = statuses[d.id] ?? "pending";
              const isHover = hoverId === d.id;
              return (
                <motion.li
                  key={d.id}
                  layout
                  initial={{ opacity: 0, x: 16, backgroundColor: "rgba(255,106,61,0.18)" }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    backgroundColor: isHover ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0)",
                  }}
                  exit={{
                    opacity: 0,
                    x: status === "confirmed" ? 320 : -320,
                    transition: { duration: 0.35 },
                  }}
                  transition={{ duration: 0.4 }}
                  onMouseEnter={() => setHoverId(d.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setFocusId(d.id)}
                  className="cursor-pointer px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-full ${
                          status === "confirmed"
                            ? "bg-ice/15 text-ice"
                            : status === "dismissed"
                              ? "bg-white/10 text-muted-foreground"
                              : "bg-ember/15 text-ember"
                        }`}
                      >
                        {status === "pending" ? (
                          <span className="relative grid h-2.5 w-2.5 place-items-center">
                            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-ember/60" />
                            <span className="relative h-2 w-2 rounded-full bg-ember" />
                          </span>
                        ) : status === "confirmed" ? (
                          "✓"
                        ) : (
                          "×"
                        )}
                      </span>
                      <div>
                        <div
                          className={`text-sm ${
                            status === "dismissed" ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {d.id} <span className="text-muted-foreground">· person</span>
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {String(d.bearing).padStart(3, "0")}° · {d.dist} m · {d.motion}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-ice">{d.conf.toFixed(2)}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {decidedAt[d.id] ?? fmtTime(d.arriveAt)}
                      </div>
                    </div>
                  </div>
                  {status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          decide(d.id, "confirmed");
                        }}
                        className="flex-1 rounded-md border border-ice/40 bg-ice/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ice transition hover:bg-ice/20"
                      >
                        ✓ Confirm
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          decide(d.id, "dismissed");
                        }}
                        className="flex-1 rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:bg-white/10"
                      >
                        × Dismiss
                      </button>
                    </div>
                  )}
                  {status === "confirmed" && (
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ice">
                      ✓ Confirmed by IC · {decidedAt[d.id]} · relayed
                    </div>
                  )}
                  {status === "dismissed" && (
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      × Dismissed · sent to retraining queue
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              No detections match filter
            </li>
          )}
        </ul>

        {/* Interactive tactical map */}
        <div className="relative mt-auto h-72 border-t border-white/10">
          <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-full border border-white/10 bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Tactical map · click marker for popup
          </div>
          <TacticalMap
            detections={mapDetections}
            hoverId={hoverId}
            focusId={focusId}
            onConfirm={(id) => decide(id, "confirmed")}
            onDismiss={(id) => decide(id, "dismissed")}
          />
        </div>
      </div>
    </div>
  );
}
