import Header from "./components/Header"
import LevelSearch from "./components/LevelSearch"
import Starfield from "./components/Starfield"

function App() {
  return (
    <>
      <Starfield />
      <Header />
      <div className="app-content">
        <LevelSearch />
      </div>
    </>
  )
}

export default App
