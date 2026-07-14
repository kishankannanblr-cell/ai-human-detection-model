import { createFileRoute, Link } from "@tanstack/react-router";
import droneNight from "../assets/drone-night.jpg";
import detectionFrame from "../assets/detection-frame.jpg";
import { PageHero } from "../components/PageHero";
import { ScenarioStepper } from "../components/ScenarioStepper";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Missions — AI scenarios on the fire ground | PYRA Vision" },
      {
        name: "description",
        content:
          "Three scenarios where AI human-detection on a firefighting drone saves lives: wildfire smoke columns, structure fires, and building collapse with debris.",
      },
      { property: "og:title", content: "AI firefighting drone missions" },
      {
        property: "og:description",
        content: "Wildfire, structure fire, and building collapse scenarios.",
      },
      { property: "og:image", content: droneNight },
      { name: "twitter:image", content: droneNight },
    ],
  }),
  component: Page,
});

const SCENARIOS = [
  {
    title: "Wildfire — trapped hikers in a smoke column",
    img: droneNight,
    tag: "01 / Wildland",
    body: "A lightning-strike ignition cuts off two hikers on a ridge. The visible feed is heavy smoke. The drone's YOLO vision model finds both signatures within seconds of arriving on scene, geo-tags them, and the IC vectors a ground crew straight to the GPS pin.",
  },
  {
    title: "Structure fire — occupants behind walls of smoke",
    img: detectionFrame,
    tag: "02 / Structure",
    body: "A three-story residential fire fills every hallway with smoke. The drone flies a tight orbit at window height. The model picks up two people on the second floor, one prone — call sign updated to 'patient down' before the entry team breaches the door.",
  },
  {
    title: "Building collapse — trapped occupants under debris",
    img: droneNight,
    tag: "03 / Debris / USAR",
    body: "After a partial structural collapse, the drone fuses vision with LiDAR to map void spaces. The classifier filters out clutter, leaving the IC a ranked list of probable trapped occupants — by location, signal strength, and motion.",
  },
];

const FIELD_USE = [
  ["Skydio X10", "Onboard VIO autonomy in smoke; multi-payload airframe."],
  ["Parrot Anafi USA", "NDAA-compliant, 32× zoom — widely deployed in US public-safety programs."],
  ["DJI Matrice 30T", "Industrial RGB + zoom, common host for custom YOLO inference packages."],
  ["Rain", "Forward-staged autonomous drone hangars that launch on detected ignitions."],
];

function Page() {
  return (
    <>
      <PageHero
        chapter="03 / Missions"
        title={
          <>
            Three places this matters.{" "}
            <span className="text-foreground/40">All of them hazardous.</span>
          </>
        }
        lede="Every scenario below is one where a human pilot cannot fly low enough or close enough to see what the drone sees — and where finding people within minutes, not hours, changes outcomes."
      />

      {/* Scenario cards */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-3">
          {SCENARIOS.map((s) => (
            <article key={s.title} className="bg-background">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={s.img}
                  alt={s.title}
                  width={1280}
                  height={896}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ember">
                  {s.tag}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-y border-white/10 bg-black/30">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-6 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-medium md:text-3xl">
              From sensor to commander · five stages.
            </h2>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Fig. 03.1 — pipeline
            </div>
          </div>
          <ScenarioStepper />
        </div>
      </section>

      {/* Used in the field */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="mb-8 flex items-end justify-between gap-6 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-medium md:text-3xl">Used in the field.</h2>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Tbl. 03.2 — programs
          </div>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {FIELD_USE.map(([n, b]) => (
            <div key={n} className="bg-background p-6">
              <h3 className="text-base font-medium">{n}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 pb-16 md:flex-row md:items-end md:justify-between">
        <p className="max-w-2xl text-muted-foreground">
          Last chapter: what the incident commander actually sees on the ground.
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
