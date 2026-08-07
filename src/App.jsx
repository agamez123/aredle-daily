import { useRef, useState } from "react"
import Header from "./components/Header"
import Home from "./components/Home"
import LevelSearch from "./components/LevelSearch"
import RoundsMode from "./components/RoundsMode"
import Starfield from "./components/Starfield"

const TRANSITION_MS = 220
const EMPTY_SCREEN = { gameMode: null, difficulty: null }

function App() {
  const [screen, setScreen] = useState(EMPTY_SCREEN)
  const [fading, setFading] = useState(false)
  const pendingScreenRef = useRef(EMPTY_SCREEN)

  function changeScreen(nextGameMode, nextDifficulty) {
    if (fading || (nextGameMode === screen.gameMode && nextDifficulty === screen.difficulty)) return
    pendingScreenRef.current = { gameMode: nextGameMode, difficulty: nextDifficulty }
    setFading(true)
    setTimeout(() => {
      setScreen(pendingScreenRef.current)
      requestAnimationFrame(() => setFading(false))
    }, TRANSITION_MS)
  }

  const { gameMode, difficulty } = screen
  const goHome = () => changeScreen(null, null)

  return (
    <>
      <Starfield />
      <Header gameMode={gameMode} difficulty={difficulty} onGoHome={gameMode ? goHome : undefined} />
      <div className={`app-content${fading ? " app-content--fading" : ""}`}>
        {gameMode === "classic" ? (
          <LevelSearch mode={difficulty} onChangeMode={goHome} />
        ) : gameMode === "rounds" ? (
          <RoundsMode mode={difficulty} onChangeMode={goHome} />
        ) : (
          <Home onStart={changeScreen} />
        )}
      </div>
    </>
  )
}

export default App
