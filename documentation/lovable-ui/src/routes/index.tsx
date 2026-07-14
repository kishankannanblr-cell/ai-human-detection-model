import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "../assets/drone-night.jpg";
import { HeroFuturistic } from "../components/HeroFuturistic";
import { LogoStrip } from "../components/LogoStrip";
import { StatCounter } from "../components/StatCounter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PYRA / Vision — AI firefighting drones that rank rooms by priority" },
      {
        name: "description",
        content:
          "AI-assisted firefighting drones: YOLO vision detects humans through smoke and debris, then ranks every room P1 → P5 for the incident commander.",
      },
      { property: "og:title", content: "PYRA / Vision — AI firefighting drones" },
      {
        property: "og:description",
        content:
          "YOLO human detection + a priority-ranked dispatch board for the incident commander.",
      },
      { property: "og:image", content: heroImage },
      { name: "twitter:image", content: heroImage },
    ],
  }),
  component: Index,
});

const triad = [
  {
    code: "01",
    title: "Detect",
    body: "A YOLO vision model finds humans through smoke and debris at 45+ FPS on the drone's edge GPU. Recall stays high where a human pilot's line of sight collapses.",
    accent: "text-ember",
  },
  {
    code: "02",
    title: "Communicate",
    body: "Every confirmed detection becomes a structured message: ID, GPS, bearing, confidence, motion. Pushed to the IC over an encrypted mesh with LTE failover.",
    accent: "text-ice",
  },
  {
    code: "03",
    title: "Rank",
    body: "Every confirmed detection is scored against fire state and victim count, then queued P1 → P5 for the dispatch board — so SAR and Suppression teams get the right call, in the right order.",
    accent: "text-signal",
  },
];

function Index() {
  return (
    <>
      <HeroFuturistic />

      {/* Why AI on the drone */}
      <section className="mx-auto max-w-[1400px] px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
              Why AI on the drone
            </div>
            <h2 className="mt-4 text-3xl font-medium md:text-5xl">
              A detection without a rank is just noise.
            </h2>
            <p className="mt-5 text-muted-foreground md:text-lg">
              A model finds people. A dispatch board turns those finds into
              action. Every detection is ranked P1 → P5 against the two
              variables that actually decide who rolls — is there fire, and
              how many victims — so the incident commander sees a sorted
              call list, not a wall of confidence scores.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/detection"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-background hover:bg-foreground/90"
              >
                YOLO detection →
              </Link>
              <Link
                to="/command"
                hash="priority"
                className="glass-panel inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-white/10"
              >
                Priority ranking
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img
              src={heroImage}
              alt="Firefighting drone flying a night mission over an active fire ground"
              width={1600}
              height={1024}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Triad */}
      <section className="mx-auto max-w-[1400px] px-6 pb-24">
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="text-2xl font-medium md:text-4xl">
            The AI loop: detect, communicate, rank.
          </h2>
          <div className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:block">
            Pipeline overview
          </div>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-3">
          {triad.map((t) => (
            <div key={t.code} className="bg-background p-8">
              <div className={`font-mono text-xs uppercase tracking-widest ${t.accent}`}>
                {t.code} · {t.title}
              </div>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-black/30">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <StatCounter value={740} suffix=" ms" label="End-to-end detection latency" />
          <StatCounter value={92} suffix="%" label="Recall on humans in dense smoke" />
          <StatCounter value={47} suffix=" FPS" label="YOLOv8 on Jetson Orin, edge" />
          <StatCounter value={3} prefix="< " suffix=" min" label="UAS time-to-air on dispatch" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-24">
        <div className="glass-panel flex flex-col items-start justify-between gap-6 rounded-2xl p-8 md:flex-row md:items-center md:p-12">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ember">
              Continue
            </div>
            <h3 className="mt-2 text-2xl font-medium md:text-3xl">
              See the YOLO model find people through smoke.
            </h3>
          </div>
          <Link
            to="/detection"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-background hover:bg-foreground/90"
          >
            Open detection →
          </Link>
        </div>
        <LogoStrip />
      </section>
    </>
  );
}
