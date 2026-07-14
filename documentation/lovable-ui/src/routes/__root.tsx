import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-signal">Error 404</div>
        <h1 className="mt-4 text-6xl font-medium">Signal lost</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          That route is off the flight plan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-background hover:bg-foreground/90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-signal">Telemetry lost</div>
        <h1 className="mt-4 text-2xl font-medium">This page didn't load.</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center rounded-sm bg-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-sm border border-rule bg-background px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PYRA / Vision — AI firefighting drones" },
      {
        name: "description",
        content:
          "AI-assisted firefighting drones: YOLO vision models find humans through smoke and debris, ranked P1 → P5 for the incident commander in under a second.",
      },
      { name: "author", content: "PYRA Vision" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "PYRA / Vision — AI firefighting drones" },
      { name: "twitter:title", content: "PYRA / Vision — AI firefighting drones" },
      { name: "description", content: "Explore the future of firefighting with AI-powered drones and their societal impact." },
      { property: "og:description", content: "Explore the future of firefighting with AI-powered drones and their societal impact." },
      { name: "twitter:description", content: "Explore the future of firefighting with AI-powered drones and their societal impact." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9fd1e247-f484-4d08-9f14-0beea227ea7d/id-preview-4ab20ff8--5d37c530-0de3-4ef0-9ac5-0bc3564cc256.lovable.app-1781344042480.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9fd1e247-f484-4d08-9f14-0beea227ea7d/id-preview-4ab20ff8--5d37c530-0de3-4ef0-9ac5-0bc3564cc256.lovable.app-1781344042480.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </QueryClientProvider>
  );
}
