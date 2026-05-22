"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // ── Register Service Worker ────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available — optionally show update banner
                console.log("[SW] New version available");
              }
            });
          });
        })
        .catch(() => {});
    }

    // ── Register Protocol Handler (web+monote://) ─────────────
    if ("registerProtocolHandler" in navigator) {
      try {
        (navigator as any).registerProtocolHandler(
          "web+monote",
          `${window.location.origin}/?uri=%s`,
          "monote"
        );
      } catch {}
    }

    // ── Handle web+monote:// deep links ───────────────────────
    const uri = new URLSearchParams(window.location.search).get("uri");
    if (uri) {
      try {
        const decoded = decodeURIComponent(uri);
        const target = new URL(decoded);
        if (target.origin === window.location.origin) {
          router.replace(target.pathname + target.search);
        }
      } catch {}
    }

    // ── Handle share_target (PWA Share Target API) ────────────
    const params = new URLSearchParams(window.location.search);
    if (
      window.location.pathname === "/post/new" &&
      (params.has("title") || params.has("text") || params.has("url"))
    ) {
      // share_target params are already on the URL — the page handles them
    }
  }, [router]);

  return <>{children}</>;
}
