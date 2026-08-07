import { useState } from "react"
import Header from "./components/Header"
import Home from "./components/Home"
import LevelSearch from "./components/LevelSearch"
import Starfield from "./components/Starfield"

function App() {
  const [mode, setMode] = useState(null)

  return (
    <>
      <Starfield />
      <Header mode={mode} onGoHome={mode ? () => setMode(null) : undefined} />
      <div className="app-content">
        {mode ? (
          <LevelSearch mode={mode} onChangeMode={() => setMode(null)} />
        ) : (
          <Home onSelectMode={setMode} />
        )}
      </div>
    </>
  )
}

export default App
