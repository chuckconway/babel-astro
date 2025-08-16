export function initMediumZoom(): void {
  // Defer import so this runs only in the browser and uses Vite bundling
  // Also avoids executing during SSR/hydration mismatch phases
  if (typeof window === "undefined" || typeof document === "undefined") return;

  import("medium-zoom")
    .then(({ default: mediumZoom }) => {
      // Add a visual cue to zoomable images
      document.querySelectorAll(".prose img").forEach((img) => img.classList.add("cursor-zoom-in"));

      const zoom = mediumZoom(".prose img", { background: "rgba(0,0,0,0.8)", margin: 24 });

      const observer = new MutationObserver(() => {
        zoom.detach();
        zoom.attach(".prose img");
        document
          .querySelectorAll(".prose img")
          .forEach((img) => img.classList.add("cursor-zoom-in"));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })
    .catch(() => {
      // Silently ignore if module couldn't be loaded in some edge case
    });
}

// Auto-initialize when loaded as a module from the page
initMediumZoom();
