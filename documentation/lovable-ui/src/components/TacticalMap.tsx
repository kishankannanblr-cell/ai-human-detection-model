import { lazy, Suspense, useEffect, useState } from "react";
import type { MapDetection } from "./TacticalMapInner";

const Inner = lazy(() => import("./TacticalMapInner"));

type Props = {
  detections: MapDetection[];
  hoverId: string | null;
  focusId: string | null;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
};

export function TacticalMap(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="grid h-full w-full place-items-center bg-black/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Loading tactical map…
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="grid h-full w-full place-items-center bg-black/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Loading tactical map…
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}

export type { MapDetection };
