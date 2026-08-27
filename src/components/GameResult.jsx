import "./GameResult.css"

function GameResult({ tone = "win", icon = "✦", image, eyebrow, headline, description }) {
  return (
    <div className={`game-result game-result--${tone}`}>
      <img className="game-result__image" src={image} alt="" aria-hidden="true" />
      <div className="game-result__body">
        <p className="game-result__eyebrow">
          <span aria-hidden="true">{icon}</span> {eyebrow}
        </p>
        <p className="game-result__headline">{headline}</p>
        {description && <p className="game-result__description">{description}</p>}
      </div>
    </div>
  )
}

export default GameResult
