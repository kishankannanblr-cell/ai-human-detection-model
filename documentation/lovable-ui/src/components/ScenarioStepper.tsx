import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const STEPS = [
  {
    id: "ingest",
    label: "Ingest",
    code: "01",
    body: "Drone streams RGB video at 30 FPS to an onboard NVIDIA Jetson Orin. Frames are color-normalized and fed to the detector queue.",
  },
  {
    id: "detect",
    label: "Detect",
    code: "02",
    body: "A YOLOv8 vision model — trained on 120k+ field frames of people in smoke and debris — runs single-shot detection at 45+ FPS on the edge.",
  },
  {
    id: "classify",
    label: "Classify",
    code: "03",
    body: "Each bounding box is scored: person vs. animal vs. clutter. A small MLP fuses motion and aspect ratio to suppress false positives.",
  },
  {
    id: "geotag",
    label: "Geo-tag",
    code: "04",
    body: "Pixel centroids are projected through the gimbal + RTK GNSS solution into WGS-84 coordinates with ±2 m horizontal accuracy. A confidence is attached.",
  },
  {
    id: "relay",
    label: "Relay → IC",
    code: "05",
    body: "Detections publish over an encrypted mesh + LTE failover as MQTT/ROS 2 topics. The Incident Commander's console renders the pin, the live tile and an audible callout in under a second.",
  },
] as const;

export function ScenarioStepper() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <ol className="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0">
        {STEPS.map((s, idx) => {
          const active = idx === i;
          return (
            <li key={s.id}>
              <button
                onClick={() => setI(idx)}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap border-l-2 px-4 py-3 text-left transition ${
                  active
                    ? "border-ember bg-white/5 text-foreground"
                    : "border-white/10 text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  {s.code}
                </span>
                <span className="flex-1 font-display">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="glass-panel rounded-2xl p-8"
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-ember">
            Stage {step.code}
          </div>
          <h3 className="mt-3 text-2xl font-medium md:text-3xl">{step.label}</h3>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {step.body}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
