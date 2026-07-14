import { Link } from "@tanstack/react-router";

const nav: { to: string; label: string; exact?: boolean; hash?: string }[] = [
  { to: "/", label: "Home", exact: true },
  { to: "/detection", label: "Detection" },
  { to: "/missions", label: "Missions" },
  { to: "/command", label: "Command" },
  { to: "/command", label: "Priority", hash: "priority" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-4 z-40 mx-auto w-full max-w-[1400px] px-6">
      <div className="glass-panel flex items-center justify-between gap-4 rounded-full px-3 py-2">
        <Link to="/" className="flex items-center gap-2 pl-2 font-mono text-[11px] uppercase tracking-widest">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ember/20 text-ember">◉</span>
          <span className="hidden sm:inline">PYRA / Vision</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={`${n.to}${n.hash ?? ""}${n.label}`}
              to={n.to}
              hash={n.hash}
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "bg-white/8 text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="pulse-dot hidden items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline-flex">
            Live Feed
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/30 text-ember">
            ⚠
          </span>
        </div>
      </div>
      <div className="mt-2 overflow-x-auto md:hidden">
        <div className="glass-panel flex gap-1 rounded-full px-3 py-2">
          {nav.map((n) => (
            <Link
              key={`${n.to}${n.hash ?? ""}${n.label}`}
              to={n.to}
              hash={n.hash}
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="whitespace-nowrap px-3 py-1 font-mono text-[11px] uppercase tracking-wider"
            >
              {n.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
