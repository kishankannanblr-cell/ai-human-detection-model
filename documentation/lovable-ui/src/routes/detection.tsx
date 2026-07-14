import { createFileRoute, Link } from "@tanstack/react-router";
import detectionFrame from "../assets/detection-frame.jpg";
import { PageHero } from "../components/PageHero";
import { YoloDetectionDemo } from "../components/YoloDetectionDemo";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Detection — YOLO human detection on a firefighting drone | PYRA Vision" },
      {
        name: "description",
        content:
          "How a YOLOv8 vision model finds people through smoke and debris at 45+ FPS on a drone's edge GPU, and how confidence becomes a coordinate.",
      },
      { property: "og:title", content: "YOLO human detection on a firefighting drone" },
      {
        property: "og:description",
        content: "Edge AI on a firefighting drone that finds humans in smoke.",
      },
      { property: "og:image", content: detectionFrame },
      { name: "twitter:image", content: detectionFrame },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero
        chapter="01 / Detection"
        title={
          <>
            YOLO, tuned for smoke and debris.{" "}
            <span className="text-foreground/40">It sees what we can't.</span>
          </>
        }
        lede="A human pilot's line of sight collapses the moment a smoke column goes black. A YOLOv8 vision model — running on the drone's edge GPU — keeps finding people anyway, frame after frame, with confidence scores tight enough to act on."
        meta="Reading time 5 min · Live demo"
      />

      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <YoloDetectionDemo />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ember">
              Live inference (simulated)
            </div>
            <h2 className="mt-3 text-2xl font-medium md:text-3xl">
              Bounding box, label, confidence — every 22 milliseconds.
            </h2>
            <p className="mt-4 text-muted-foreground">
              The HUD above is what the drone sees. Each box is a YOLO
              detection. The label reads <code className="text-ice">person · 0.94</code>:
              the model is 94% sure the highlighted region is a person.
              The scan line is the frame the GPU is currently chewing on.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><span className="text-ember">◉</span> Single-shot detector — no region proposals, one forward pass per frame.</li>
              <li className="flex gap-3"><span className="text-ember">◉</span> 640×512 RGB input, color-normalized to the model's training distribution.</li>
              <li className="flex gap-3"><span className="text-ember">◉</span> TensorRT INT8 export — 4× faster than vanilla PyTorch on Jetson Orin.</li>
              <li className="flex gap-3"><span className="text-ember">◉</span> Detections below 0.6 confidence are dropped before they ever reach the IC.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Training data */}
      <section className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-6 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-medium md:text-3xl">How it learns smoke.</h2>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Tbl. 01.1 — training stack
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["COCO Person", "Baseline person class from the COCO dataset — every general-purpose YOLO checkpoint starts here."],
              ["Wildfire Smoke Set", "Field-captured frames of pedestrians partially occluded by smoke and haze."],
              ["Field captures", "120k+ frames from real fire-ground drone flights — survivors prone, partial-occlusion, crawling, post-collapse."],
              ["Synthetic smoke", "Domain-randomized renders: humans in volumetric smoke, varied contrast, debris occlusion."],
            ].map(([t, b]) => (
              <div key={t} className="bg-background p-6">
                <h3 className="text-base font-medium">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latency budget */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:items-start">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ember">
              02 / Latency budget
            </div>
            <h2 className="mt-3 text-2xl font-medium md:text-3xl">
              Why edge inference matters.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sending raw 4K video back to a ground station and running YOLO
              there would take 3–5 seconds round-trip on a degraded radio
              link. A trapped person can move 20 m in that time. So the
              model lives on the drone.
            </p>
          </div>
          <div className="glass-panel rounded-2xl">
            <div className="border-b border-white/10 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Single detection · cold loop
            </div>
            <ul className="divide-y divide-white/10">
              {[
                ["Capture (RGB sensor)", "8 ms"],
                ["Color normalize + tensor pack", "4 ms"],
                ["YOLOv8 forward pass (Jetson Orin, INT8)", "22 ms"],
                ["Classifier + NMS", "6 ms"],
                ["Geo-projection (gimbal + RTK)", "5 ms"],
                ["Encode + publish to mesh", "12 ms"],
                ["IC console render", "≈700 ms (incl. radio)"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span>{k}</span>
                  <span className="font-mono text-ice">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 pb-16 md:flex-row md:items-end md:justify-between">
        <p className="max-w-2xl text-muted-foreground">
          Next: how confirmed detections reach the incident commander — and
          get ranked P1 → P5 for dispatch.
        </p>
        <Link
          to="/command"
          className="inline-flex items-center gap-2 self-start rounded-full bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-background hover:bg-foreground/90"
        >
          Continue → Command
        </Link>
      </section>
    </>
  );
}
