// Umami analytics. Named telemetry.js rather than analytics.js because
// tracker blockers match the filename: in dev, Vite serves every module as its
// own request, so a blocked module would take down the whole app.
//
// The tracking script is only injected when VITE_UMAMI_WEBSITE_ID is
// configured, so local dev and any deploy that hasn't set an ID up yet just
// no-op instead of pointing traffic at someone else's Umami instance.
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID
const SCRIPT_SRC = import.meta.env.VITE_UMAMI_SRC || "https://cloud.umami.is/script.js"

let injected = false

export function initTelemetry() {
  if (injected || !WEBSITE_ID || typeof document === "undefined") return
  injected = true
  const script = document.createElement("script")
  script.defer = true
  script.src = SCRIPT_SRC
  script.dataset.websiteId = WEBSITE_ID
  document.head.appendChild(script)
}

// Fires a custom Umami event. Safe to call from anywhere: no-ops if analytics
// isn't configured, the script hasn't loaded yet, or a tracker blocker ate it.
// Fire-and-forget, never throws — analytics must not break gameplay.
export function track(eventName, data) {
  try {
    window.umami?.track(eventName, data)
  } catch {
    // Swallowed on purpose.
  }
}

export function comboKey(gameMode, difficulty, isDaily) {
  return `${gameMode}:${difficulty}:${isDaily ? "daily" : "unlimited"}`
}
