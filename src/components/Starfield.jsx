import { useMemo } from "react"
import "./Starfield.css"

// Simple seeded PRNG so the field looks the same on every render/reload
// instead of reshuffling and popping on each re-mount.
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const LAYERS = [
  { count: 70, className: "star--far" },
  { count: 40, className: "star--mid" },
  { count: 14, className: "star--near" },
]

function buildStars() {
  const rand = mulberry32(1327)
  return LAYERS.flatMap((layer, layerIndex) =>
    Array.from({ length: layer.count }, (_, i) => ({
      id: `${layerIndex}-${i}`,
      className: layer.className,
      top: rand() * 100,
      left: rand() * 100,
      duration: 3 + rand() * 5,
      delay: rand() * 5,
    }))
  )
}

function Starfield() {
  const stars = useMemo(buildStars, [])

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className={`star ${star.className}`}
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            "--duration": `${star.duration}s`,
            "--delay": `${star.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default Starfield
