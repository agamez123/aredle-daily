import { readJson, writeJson } from "./storage"

const KEY = "theme"

// Applied from main.jsx before React mounts, so a player who picked light mode
// doesn't get a frame of dark background on every load.
export function initTheme() {
  const theme = readJson(KEY) ?? systemTheme()
  applyTheme(theme)
  return theme
}

export function systemTheme() {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
  } catch {
    return "dark"
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

export function setTheme(theme) {
  applyTheme(theme)
  writeJson(KEY, theme)
}

export function currentTheme() {
  return document.documentElement.dataset.theme || "dark"
}
