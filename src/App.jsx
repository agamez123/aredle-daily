import { useEffect, useRef, useState } from "react"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./components/Home"
import LevelSearch from "./components/LevelSearch"
import RoundsMode from "./components/RoundsMode"
import Starfield from "./components/Starfield"
import { preloadPools, useLevelPools } from "./data/modes"
import { readJson, writeJson } from "./lib/storage"

const TRANSITION_MS = 220
const EMPTY_SCREEN = { gameMode: null, difficulty: null, isDaily: true }
const SCREEN_KEY = "screen"

// Reloading mid-puzzle should put you back on the board you were playing, not
// at the mode picker. Only daily boards are restored — an unlimited run is
// thrown away on reload anyway, so returning to it would show a fresh level
// with no explanation.
function restoreScreen() {
  const saved = readJson(SCREEN_KEY)
  if (!saved?.isDaily) return EMPTY_SCREEN
  if (!["classic", "rounds"].includes(saved.gameMode)) return EMPTY_SCREEN
  if (!["easy", "hard"].includes(saved.difficulty)) return EMPTY_SCREEN
  return { gameMode: saved.gameMode, difficulty: saved.difficulty, isDaily: true }
}

function App() {
  const [screen, setScreen] = useState(restoreScreen)
  const [fading, setFading] = useState(false)
  const [openModal, setOpenModal] = useState(null)
  // Bumped whenever the stats modal is opened, so an already-mounted panel
  // re-reads localStorage instead of showing the numbers from last time.
  const [statsToken, setStatsToken] = useState(0)
  const pendingScreenRef = useRef(EMPTY_SCREEN)

  // Start pulling the level chunk immediately, so it has almost always landed
  // by the time anyone finishes choosing a mode.
  useEffect(preloadPools, [])
  const { pools, error } = useLevelPools()

  function changeScreen(nextGameMode, nextDifficulty, nextIsDaily = true) {
    if (fading) return
    if (
      nextGameMode === screen.gameMode &&
      nextDifficulty === screen.difficulty &&
      nextIsDaily === screen.isDaily
    ) {
      return
    }
    pendingScreenRef.current = {
      gameMode: nextGameMode,
      difficulty: nextDifficulty,
      isDaily: nextIsDaily,
    }
    setFading(true)
    setTimeout(() => {
      setScreen(pendingScreenRef.current)
      requestAnimationFrame(() => setFading(false))
    }, TRANSITION_MS)
  }

  const { gameMode, difficulty, isDaily } = screen
  const goHome = () => changeScreen(null, null, true)

  useEffect(() => {
    writeJson(SCREEN_KEY, screen)
  }, [screen])
  const pool = pools && difficulty ? pools[difficulty] : null

  function openStats() {
    setStatsToken((t) => t + 1)
    setOpenModal("stats")
  }

  return (
    <>
      <Starfield />
      <Header
        gameMode={gameMode}
        difficulty={difficulty}
        isDaily={isDaily}
        onGoHome={gameMode ? goHome : undefined}
        openModal={openModal}
        onOpenModal={(name) => (name === "stats" ? openStats() : setOpenModal(name))}
        statsToken={statsToken}
      />
      <div className={`app-content${fading ? " app-content--fading" : ""}`}>
        {error ? (
          <p className="app-loading">Couldn&apos;t load the level list. Try reloading.</p>
        ) : gameMode && !pool ? (
          <p className="app-loading">Loading levels…</p>
        ) : gameMode === "classic" ? (
          <LevelSearch
            key={`classic:${difficulty}:${isDaily}`}
            pool={pool}
            difficulty={difficulty}
            isDaily={isDaily}
            onChangeMode={goHome}
            onOpenStats={openStats}
          />
        ) : gameMode === "rounds" ? (
          <RoundsMode
            key={`rounds:${difficulty}:${isDaily}`}
            pool={pool}
            difficulty={difficulty}
            isDaily={isDaily}
            onChangeMode={goHome}
            onOpenStats={openStats}
          />
        ) : (
          <Home onStart={changeScreen} pools={pools} />
        )}
      </div>
      <Footer />
    </>
  )
}

export default App
