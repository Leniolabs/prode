import React from "react";

/**
 * Returns whether the current browser can share files via the Web Share API.
 * The story image/video buttons depend on `navigator.share` with a file
 * payload, which is effectively mobile-only. Desktop browsers either lack
 * `navigator.share` entirely or reject file payloads, so we use this to hide
 * those buttons on desktop.
 *
 * Starts `false` and resolves after mount to avoid an SSR hydration mismatch.
 */
export function useCanShareFiles() {
  const [canShareFiles, setCanShareFiles] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.canShare !== "function") return;

    try {
      const probe = new File([""], "probe.png", { type: "image/png" });
      setCanShareFiles(navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  return canShareFiles;
}
