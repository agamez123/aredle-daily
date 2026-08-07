import { useRef, useState } from "react"
import Header from "./components/Header"
import Home from "./components/Home"
import LevelSearch from "./components/LevelSearch"
import Starfield from "./components/Starfield"

const TRANSITION_MS = 220

function App() {
  const [mode, setMode] = useState(null)
  const [fading, setFading] = useState(false)
  const pendingModeRef = useRef(null)

  function changeMode(nextMode) {
    if (fading || nextMode === mode) return
    pendingModeRef.current = nextMode
    setFading(true)
    setTimeout(() => {
      setMode(pendingModeRef.current)
      requestAnimationFrame(() => setFading(false))
    }, TRANSITION_MS)
  }

  return (
    <>
      <Starfield />
      <Header mode={mode} onGoHome={mode ? () => changeMode(null) : undefined} />
      <div className={`app-content${fading ? " app-content--fading" : ""}`}>
        {mode ? (
          <LevelSearch mode={mode} onChangeMode={() => changeMode(null)} />
        ) : (
          <Home onSelectMode={changeMode} />
        )}
      </div>
    </>
  )
}

export default App
