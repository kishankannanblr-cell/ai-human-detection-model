import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

type Tone = "critical" | "sar" | "suppression";

type Rank = {
  code: "P1" | "P2" | "P3" | "P4" | "P5";
  category: string;
  trigger: string;
  team: string;
  tone: Tone;
};

const RANK_RUBRIC: Rank[] = [
  { code: "P1", category: "Critical — Multi-victim + Fire", trigger: "2+ trapped victims AND active fire", team: "SAR (mass) + Suppression", tone: "critical" },
  { code: "P2", category: "Critical — Single-victim + Fire", trigger: "1 trapped victim AND active fire", team: "SAR + Suppression", tone: "critical" },
  { code: "P3", category: "Lower A — Multi-victim, no fire", trigger: "2+ trapped victims, no visible fire", team: "SAR (mass)", tone: "sar" },
  { code: "P4", category: "Lower A — Single-victim, no fire", trigger: "1 trapped victim, no visible fire", team: "SAR", tone: "sar" },
  { code: "P5", category: "Lower B — Fire, no victims", trigger: "Active fire, no victims spotted", team: "Suppression", tone: "suppression" },
];

type Incident = {
  id: string;
  rank: Rank["code"];
  grid: string;
  bearing: number;
  victims: number;
  fire: boolean;
  note: string;
};

const SEED_INCIDENTS: Incident[] = [
  { id: "INC-01", rank: "P1", grid: "11S NA 4213 6021", bearing: 41, victims: 3, fire: true, note: "Three signatures clustered on ridge east flank; flame front 90 m out and closing." },
  { id: "INC-02", rank: "P2", grid: "11S NA 4198 6055", bearing: 65, victims: 1, fire: true, note: "Prone signature in structure interior; smoke column above roofline, active fire on floor 2." },
  { id: "INC-03", rank: "P3", grid: "11S NA 4174 6112", bearing: 118, victims: 2, fire: false, note: "Two people in vehicle off service road; no active fire within 400 m." },
  { id: "INC-04", rank: "P4", grid: "11S NA 4155 6088", bearing: 202, victims: 1, fire: false, note: "Single moving signature on drainage trail; clear of active burn perimeter." },
  { id: "INC-05", rank: "P5", grid: "11S NA 4131 6144", bearing: 287, victims: 0, fire: true, note: "Spot fire flanking sector D; unoccupied fuel load, no human signatures within cone." },
];

const toneStyles: Record<Tone, { badge: string; ring: string; text: string; chip: string }> = {
  critical: { badge: "bg-ember text-black", ring: "ring-ember/40", text: "text-ember", chip: "border-ember/40 bg-ember/10 text-ember" },
  sar: { badge: "bg-ice text-black", ring: "ring-ice/40", text: "text-ice", chip: "border-ice/40 bg-ice/10 text-ice" },
  suppression: { badge: "bg-signal text-black", ring: "ring-signal/40", text: "text-signal", chip: "border-signal/40 bg-signal/10 text-signal" },
};

const ALL_RANKS: Rank["code"][] = ["P1", "P2", "P3", "P4", "P5"];

export function PriorityRankBoard() {
  const [statuses, setStatuses] = useState<Record<string, "active" | "dispatched" | "standdown">>(
    () => Object.fromEntries(SEED_INCIDENTS.map((i) => [i.id, "active"])),
  );
  const [query, setQuery] = useState("");
  const [ranks, setRanks] = useState<Set<Rank["code"]>>(new Set(ALL_RANKS));

  const toggleRank = (r: Rank["code"]) =>
    setRanks((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });

  const dispatch = (inc: Incident) => {
    setStatuses((s) => ({ ...s, [inc.id]: "dispatched" }));
    const rank = RANK_RUBRIC.find((r) => r.code === inc.rank)!;
    toast.success(`${inc.id} dispatched`, {
      description: `${rank.team} routed to ${inc.grid.split(" ").slice(-2).join(" ")}.`,
    });
  };
  const standdown = (inc: Incident) => {
    setStatuses((s) => ({ ...s, [inc.id]: "standdown" }));
    toast(`${inc.id} stood down`, { description: "Rank archived. No units routed." });
  };
  const reset = () => {
    setStatuses(Object.fromEntries(SEED_INCIDENTS.map((i) => [i.id, "active" as const])));
    toast.message("Priority board reset");
  };

  const active = SEED_INCIDENTS.filter((i) => statuses[i.id] === "active");
  const dispatched = SEED_INCIDENTS.filter((i) => statuses[i.id] === "dispatched");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active
      .filter((i) => ranks.has(i.rank))
      .filter((i) => {
        if (!q) return true;
        return (
          i.id.toLowerCase().includes(q) ||
          i.rank.toLowerCase().includes(q) ||
          i.grid.toLowerCase().includes(q) ||
          i.note.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.rank.localeCompare(b.rank));
  }, [active, ranks, query]);

  return (
    <div id="priority" className="grid gap-8">
      {/* Rubric */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ember">
            Aspects to consider when giving a Priority Rank
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Fire state × victim volume — not raw confidence
          </div>
        </div>
        <p className="border-b border-white/10 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          Firefighters can't trust a raw score like{" "}
          <code className="text-ice">0.91</code> vs.{" "}
          <code className="text-ice">0.63</code> in a life-or-death call without context.
          The dashboard categorizes detections by logical state and victim volume, so every rank maps directly to the tactical team being dispatched — Search &amp; Rescue vs. Suppression, single vs. multi-victim.
        </p>
        <ul className="divide-y divide-white/5">
          {RANK_RUBRIC.map((r) => {
            const s = toneStyles[r.tone];
            return (
              <li key={r.code} className="grid gap-3 px-5 py-4 md:grid-cols-[70px_1.4fr_1.4fr_1fr] md:items-center">
                <span className={`grid h-10 w-10 place-items-center rounded-full font-mono text-xs font-medium ring-1 ${s.badge} ${s.ring}`}>
                  {r.code}
                </span>
                <div>
                  <div className={`text-sm ${s.text}`}>{r.category}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Priority order · {r.code.replace("P", "")} of 5
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{r.trigger}</div>
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${s.chip}`}>
                    {r.team}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Live ranked incidents */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        {/* Counters */}
        <div className="grid grid-cols-3 border-b border-white/10 font-mono text-[10px] uppercase tracking-widest">
          <div className="px-4 py-2.5">
            <div className="text-muted-foreground">Active</div>
            <div className="text-sm text-ember">{active.length}</div>
          </div>
          <div className="border-l border-white/10 px-4 py-2.5">
            <div className="text-muted-foreground">Dispatched</div>
            <div className="text-sm text-ice">{dispatched.length}</div>
          </div>
          <div className="border-l border-white/10 px-4 py-2.5">
            <div className="text-muted-foreground">Filtered view</div>
            <div className="text-sm text-foreground">{visible.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by INC-*, rank, grid, or keyword…"
            className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-ember/60 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Ranks:</span>
            {ALL_RANKS.map((r) => {
              const on = ranks.has(r);
              const s = toneStyles[RANK_RUBRIC.find((x) => x.code === r)!.tone];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRank(r)}
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest transition ${
                    on
                      ? s.chip
                      : "border-white/10 text-muted-foreground line-through hover:bg-white/5"
                  }`}
                >
                  {r}
                </button>
              );
            })}
            <button
              type="button"
              onClick={reset}
              className="ml-auto rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-white/5"
            >
              ↻ Reset board
            </button>
          </div>
        </div>

        <ul className="divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {visible.map((inc) => {
              const rank = RANK_RUBRIC.find((r) => r.code === inc.rank)!;
              const s = toneStyles[rank.tone];
              const critical = inc.rank === "P1" || inc.rank === "P2";
              return (
                <motion.li
                  key={inc.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 320, transition: { duration: 0.35 } }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03] md:grid-cols-[80px_1.2fr_1.4fr_auto]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`relative grid h-11 w-11 place-items-center rounded-full font-mono text-xs font-medium ring-1 ${s.badge} ${s.ring}`}>
                      {inc.rank}
                      {critical && (
                        <motion.span
                          aria-hidden
                          className="absolute inset-0 rounded-full border border-ember"
                          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.35, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm">
                      {inc.id} <span className="text-muted-foreground">· {rank.category}</span>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {inc.grid} · {String(inc.bearing).padStart(3, "0")}°
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{inc.note}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                        inc.victims >= 2 ? "border-ember/40 bg-ember/10 text-ember" : inc.victims === 1 ? "border-ice/40 bg-ice/10 text-ice" : "border-white/15 bg-white/[0.03] text-muted-foreground"
                      }`}>
                        {inc.victims} victim{inc.victims === 1 ? "" : "s"}
                      </span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                        inc.fire ? "border-ember/40 bg-ember/10 text-ember" : "border-white/15 bg-white/[0.03] text-muted-foreground"
                      }`}>
                        {inc.fire ? "Active fire" : "No visible fire"}
                      </span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${s.chip}`}>
                        {rank.team}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 md:flex-col md:items-end">
                    <button
                      type="button"
                      onClick={() => dispatch(inc)}
                      className="rounded-md border border-ice/40 bg-ice/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ice transition hover:bg-ice/20"
                    >
                      ✓ Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => standdown(inc)}
                      className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:bg-white/10"
                    >
                      × Stand down
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {visible.length === 0 && (
            <li className="px-5 py-8 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              No incidents match filter · adjust search or ranks
            </li>
          )}
        </ul>

        {dispatched.length > 0 && (
          <div className="border-t border-white/10 bg-black/40 px-5 py-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ice">
              Dispatched log · {dispatched.length}
            </div>
            <ul className="flex flex-wrap gap-2">
              {dispatched.map((inc) => (
                <li
                  key={inc.id}
                  className="inline-flex items-center gap-2 rounded-full border border-ice/30 bg-ice/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ice"
                >
                  <span>{inc.rank} · {inc.id}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-white/10 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Order is deterministic. P1 stays on top regardless of detection time or raw confidence.
        </div>
      </div>
    </div>
  );
}
