import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import detectionFrame from "../assets/detection-frame.jpg";

type Box = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  conf: number;
  label: string;
  trackId: string;
  tempC: number;
  posture: string;
  rangeM: number;
};

const BOXES: Box[] = [
  { id: "p1", x: 19, y: 42, w: 14, h: 22, conf: 0.94, label: "person", trackId: "trk_0427", tempC: 34.8, posture: "prone", rangeM: 18 },
  { id: "p2", x: 44, y: 48, w: 13, h: 22, conf: 0.88, label: "person", trackId: "trk_0431", tempC: 33.1, posture: "crawling", rangeM: 22 },
  { id: "p3", x: 69, y: 44, w: 14, h: 22, conf: 0.91, label: "person", trackId: "trk_0435", tempC: 35.6, posture: "prone", rangeM: 16 },
];

export function YoloDetectionDemo() {
  const [shown, setShown] = useState<string[]>([]);
  const [pulsed, setPulsed] = useState<string[]>([]);
  const [fps, setFps] = useState(46);
  const [confs, setConfs] = useState<Record<string, number>>(
    Object.fromEntries(BOXES.map((b) => [b.id, 0])),
  );
  const [temps, setTemps] = useState<Record<string, number>>(
    Object.fromEntries(BOXES.map((b) => [b.id, b.tempC])),
  );
  const [ambient, setAmbient] = useState(62);
  const [hotSpots, setHotSpots] = useState(2);
  const lockedRef = useRef<Record<string, boolean>>({});

  // Acquisition cycle: stagger boxes in, hold ~5s, reset, repeat.
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const runCycle = () => {
      setShown([]);
      setPulsed([]);
      setConfs(Object.fromEntries(BOXES.map((b) => [b.id, 0])));
      lockedRef.current = {};
      BOXES.forEach((b, i) => {
        const delay = 600 + i * 850;
        timers.push(
          setTimeout(() => {
            setShown((s) => (s.includes(b.id) ? s : [...s, b.id]));
            setPulsed((p) => [...p, b.id]);
            // count-up confidence over ~450ms
            const steps = 14;
            const target = b.conf;
            for (let k = 1; k <= steps; k++) {
              timers.push(
                setTimeout(() => {
                  setConfs((c) => ({ ...c, [b.id]: (target * k) / steps }));
                  if (k === steps) lockedRef.current[b.id] = true;
                }, (k * 450) / steps),
              );
            }
            // drop pulse after 900ms
            timers.push(
              setTimeout(() => {
                setPulsed((p) => p.filter((x) => x !== b.id));
              }, 900),
            );
          }, delay),
        );
      });
    };
    runCycle();
    const loop = setInterval(runCycle, 7000);
    return () => {
      clearInterval(loop);
      timers.forEach(clearTimeout);
    };
  }, []);

  // FPS + jitter loop
  useEffect(() => {
    const t = setInterval(() => {
      setFps((f) => Math.round((f * 0.6 + (45 + Math.random() * 4) * 0.4) * 10) / 10);
      setConfs((c) => {
        const next = { ...c };
        for (const b of BOXES) {
          if (!lockedRef.current[b.id]) continue;
          const drift = (Math.random() - 0.5) * 0.02;
          next[b.id] = Math.max(0.78, Math.min(0.98, (c[b.id] ?? b.conf) + drift));
        }
        return next;
      });
      setTemps((tm) => {
        const next: Record<string, number> = {};
        for (const b of BOXES) {
          const cur = tm[b.id] ?? b.tempC;
          const drift = (Math.random() - 0.5) * 0.4;
          next[b.id] = Math.round((cur + drift) * 10) / 10;
        }
        return next;
      });
      setAmbient((a) => Math.round((a * 0.7 + (60 + Math.random() * 6) * 0.3) * 10) / 10);
      setHotSpots(2 + Math.round(Math.random()));
    }, 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
      <img
        src={detectionFrame}
        alt="Aerial frame from a firefighting drone, three partial human figures visible through smoke"
        width={1280}
        height={896}
        loading="lazy"
        className="block aspect-[4/3] w-full object-cover"
      />
      {/* scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-ice/80 shadow-[0_0_18px_2px] shadow-ice/60 animate-scanline" />

      {/* HUD overlay */}
      <div className="pointer-events-none absolute inset-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <AnimatePresence>
            {BOXES.filter((b) => shown.includes(b.id)).map((b) => {
              const cx = b.x + b.w / 2;
              const cy = b.y + b.h / 2;
              const isPulsing = pulsed.includes(b.id);
              return (
                <motion.g
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 0.85, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-ember"
                  style={{ transformOrigin: `${cx}% ${cy}%`, transformBox: "fill-box" } as React.CSSProperties}
                >
                  {/* acquisition pulse ring */}
                  {isPulsing && (
                    <motion.rect
                      x={b.x}
                      y={b.y}
                      width={b.w}
                      height={b.h}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.3"
                      initial={{ opacity: 0.9, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.4 }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" } as React.CSSProperties}
                    />
                  )}
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.2"
                  />
                  {[
                    [b.x, b.y],
                    [b.x + b.w, b.y],
                    [b.x, b.y + b.h],
                    [b.x + b.w, b.y + b.h],
                  ].map(([tx, ty], idx) => (
                    <circle key={idx} cx={tx} cy={ty} r="0.5" className="fill-ember" />
                  ))}
                  <line x1={cx - 1.2} y1={cy} x2={cx + 1.2} y2={cy} stroke="currentColor" strokeWidth="0.15" />
                  <line x1={cx} y1={cy - 1.2} x2={cx} y2={cy + 1.2} stroke="currentColor" strokeWidth="0.15" />
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* labels */}
        {BOXES.filter((b) => shown.includes(b.id)).map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -translate-y-full"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            <div className="mb-1 inline-block rounded-sm bg-ember px-2 py-1 font-mono text-[9px] uppercase leading-tight tracking-widest text-black">
              <div>
                {b.label} · {(confs[b.id] ?? 0).toFixed(2)} · {b.trackId}
              </div>
              <div className="opacity-80">
                {(temps[b.id] ?? b.tempC).toFixed(1)}°C · {b.posture} · {b.rangeM} m
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* HUD chrome — top */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ice">
          <span className="pulse-dot" />
          YOLOv8 · {fps.toFixed(1)} fps · conf ≥ 0.60
        </div>
        <motion.div
          key={shown.length}
          initial={{ scale: 1.08, color: "#ff6a3d" }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-full border border-ember/40 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ember"
        >
          Humans detected · {shown.length}
        </motion.div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1">
        <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          RGB 4K · 640×512 crop
        </div>
        <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Gimbal stabilised · AGC on
        </div>
      </div>

      {/* Scene analysis */}
      <div className="pointer-events-none absolute bottom-3 left-3 w-[260px] rounded-md border border-white/10 bg-black/70 p-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5 text-ember">
          <span>Scene analysis</span>
          <span className="pulse-dot" />
        </div>
        <dl className="space-y-1">
          <div className="flex justify-between gap-2">
            <dt>Humans detected</dt>
            <dd className="text-foreground">{shown.length}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Ambient (scene avg)</dt>
            <dd className="text-foreground">{ambient.toFixed(1)}°C</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Fire hot spots</dt>
            <dd className="text-ember">{hotSpots} · active fire</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Structural debris</dt>
            <dd className="text-foreground">NW quadrant</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Smoke opacity</dt>
            <dd className="text-foreground">87% · vis ≪ 2 m</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Egress (S corridor)</dt>
            <dd className="text-ember">blocked</dd>
          </div>
        </dl>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-white/10 bg-black/70 p-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
        <div className="space-y-1 text-right">
          <div>AGL 42 m · gimbal −38°</div>
          <div>RTK fix · mesh −71 dBm</div>
          <div className="text-ice">yolov8s · v3.2 · 9f1c</div>
        </div>
      </div>
    </div>
  );
}
