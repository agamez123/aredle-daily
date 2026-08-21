// Umami analytics. The tracking script is only injected when
// VITE_UMAMI_WEBSITE_ID is configured, so local dev and any deploy that
// hasn't set an ID up yet just no-ops instead of accidentally pointing
// traffic at someone else's Umami instance.
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID
const SCRIPT_SRC = import.meta.env.VITE_UMAMI_SRC || "https://cloud.umami.is/script.js"

let injected = false

function ensureScriptInjected() {
  if (injected || !WEBSITE_ID || typeof document === "undefined") return
  injected = true
  const script = document.createElement("script")
  script.defer = true
  script.src = SCRIPT_SRC
  script.dataset.websiteId = WEBSITE_ID
  document.head.appendChild(script)
}

ensureScriptInjected()

// Fires a custom Umami event. Safe to call unconditionally from anywhere in
// the app: no-ops if analytics isn't configured, the script hasn't loaded
// yet, or it's blocked by an ad/tracker blocker. Fire-and-forget, never
// throws, never blocks gameplay.
export function track(eventName, data) {
  try {
    window.umami?.track(eventName, data)
  } catch {
    // Analytics should never break the game.
  }
}
