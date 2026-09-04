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

// The script loads async, so mount-time events (game_started) are fired before
// window.umami exists. Umami installs no pre-load stub, so without a buffer of
// our own those events are dropped on the floor. Hold them here and flush once
// the script reports ready. Capped so a permanently-blocked tracker can't grow
// this without bound.
const QUEUE_LIMIT = 50
let queue = []
let ready = false

function flushQueue() {
  ready = true
  const pending = queue
  queue = []
  for (const [eventName, data] of pending) send(eventName, data)
}

function send(eventName, data) {
  try {
    window.umami?.track(eventName, data)
  } catch {
    // Swallowed on purpose.
  }
}

export function initTelemetry() {
  if (injected || !WEBSITE_ID || typeof document === "undefined") return
  injected = true
  const script = document.createElement("script")
  script.defer = true
  script.src = SCRIPT_SRC
  script.dataset.websiteId = WEBSITE_ID
  script.addEventListener("load", flushQueue)
  script.addEventListener("error", () => {
    // A blocked or failed script is never coming back — drop the backlog so it
    // doesn't sit in memory for the rest of the session.
    queue = []
  })
  document.head.appendChild(script)
}

// Fires a custom Umami event. Safe to call from anywhere: no-ops if analytics
// isn't configured, and buffers until the script has loaded so an event fired
// on mount isn't lost to the script's own load latency. A tracker blocker that
// eats the script still ends up a no-op, just after the error handler fires.
// Fire-and-forget, never throws — analytics must not break gameplay.
export function track(eventName, data) {
  if (!WEBSITE_ID) return
  if (ready || window.umami) {
    send(eventName, data)
    return
  }
  if (queue.length < QUEUE_LIMIT) queue.push([eventName, data])
}

export function comboKey(gameMode, difficulty, isDaily) {
  return `${gameMode}:${difficulty}:${isDaily ? "daily" : "unlimited"}`
}
