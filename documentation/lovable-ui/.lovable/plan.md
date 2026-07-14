## Goal
Turn the `/command` page from a passive mockup into a tool that feels operable — real state on actions, filterable queues, interactive charts, and an interactive tactical map.

## 1. Real state on the Detection Queue (`CommanderConsole.tsx`)
- Stop the 16s cycle from wiping user decisions. Rework the loop so it only streams *new* seed detections into a persistent queue; confirmed/dismissed items stay decided.
- On **Confirm**: slide the card out (motion `exit` with `x: 320, opacity: 0`), move it to a `Resolved` list, increment a `Resolved` counter, decrement `Pending`, fire a sonner toast: *"H-018 dispatch confirmed. Eng-3, Truck-1 routed."*
- On **Dismiss**: slide-out to the left, increment `Dismissed`, toast: *"H-018 dismissed. Flagged for retraining."*
- Header counters become live: `Active · Pending · Resolved · Dismissed` (was just pending).
- Add a small "Resolved / Dismissed" collapsible strip under the queue so decisions are auditable, with an "Undo" affordance on the most recent action (10s window).
- Mount `<Toaster />` (sonner) once at `__root.tsx`.

## 2. Search + filter on the queue
Above the queue, add:
- A text search input (filters by ID, motion, bearing, or `person`/`fire` keyword).
- Status filter chips: `All · Pending · Confirmed · Dismissed`.
- Results update in real time; empty state shows "No detections match filter."

## 3. Interactive Priority Rank board (`PriorityRankBoard.tsx`)
- Add per-incident **Dispatch** and **Stand down** buttons. Dispatched items slide out into a "Dispatched" tray, toast confirms the team routed.
- Live counters: `Active · Dispatched`.
- Search bar filtering by `INC-*`, rank (`P1..P5`), or grid coordinate substring.
- Rank filter toggle row (P1..P5, multi-select).

## 4. Interactive tactical map
Replace the static SVG sector map at the bottom of `CommanderConsole` with a real **Leaflet** map (pure open-source, no API keys, no Mapbox connector needed):
- `react-leaflet` + `leaflet` packages, dark-satellite base tiles from Esri (`World_Imagery`) or CARTO dark — both keyless.
- Markers for each visible detection at synthetic lat/lng (derived from bearing/distance around a fixed UAS origin so pins move with the same seed data).
- Clicking a marker: pans + opens a popup with `ID · bearing · distance · confidence · Confirm/Dismiss` buttons wired to the same reducer.
- Hovering a queue card highlights its map marker; clicking a card pans the map.
- Fire perimeter drawn as a `Polygon` overlay, drone position as a pulsing custom `divIcon`.
- Layer toggle: `Satellite · Dark · Terrain`.

## 5. Interactive charts (latency + confidence over time)
Add a new "Telemetry" strip on `/command` under the console, using **Recharts** (already common, no auth). Two panels:
- **Latency breakdown** — stacked bar per stage (capture → inference → relay → callout), hover tooltips with ms values, toggle series legend to hide/show a stage.
- **Confidence over time** — line chart of the last N detections' confidence; brush component to zoom a time range.
Both use the same seed data set streamed by the console so they stay in sync.

## 6. Files
**New**
- `src/components/TacticalMap.tsx` — Leaflet map, marker sync via props/context.
- `src/components/CommandTelemetry.tsx` — Recharts panels.
- `src/components/QueueFilters.tsx` — shared search/filter chips.
- `src/lib/command-store.ts` — small Zustand-free React context + reducer holding detections/statuses so console, map, priority board, and charts share state.

**Edit**
- `src/components/CommanderConsole.tsx` — consume store, slide-out on decisions, wire filters, swap SVG map for `TacticalMap`.
- `src/components/PriorityRankBoard.tsx` — dispatch/stand-down actions, filters, counters.
- `src/routes/command.tsx` — mount `CommandTelemetry`, wrap page in the store provider.
- `src/routes/__root.tsx` — mount sonner `<Toaster />`.

## 7. Dependencies
- `leaflet`, `react-leaflet`, `@types/leaflet`
- `recharts`
- Leaflet CSS: `import "leaflet/dist/leaflet.css"` inside `TacticalMap.tsx` (client-only, fine under Vite).

## Technical notes
- Leaflet is browser-only. Guard the map with a `useEffect` mount + `typeof window` check, or dynamic-import it in a `client:only` wrapper to avoid SSR crash on TanStack Start.
- No backend / no schema changes. State is local (React context), persisted to `sessionStorage` so a refresh keeps decisions.
- The 16s streaming loop only *adds* seed detections that aren't already in the store; user decisions are never overwritten.
- Toasts: `toast.success` / `toast.message` from `sonner`; keep messages under one line.
- No changes to `/detection`, `/missions`, or the marketing routes.

Ask: OK to add Leaflet + Recharts and wire it as above, or would you rather I hold off on the map and just do state + filters + charts first?