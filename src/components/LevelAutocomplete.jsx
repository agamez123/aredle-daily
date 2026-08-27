import { useEffect, useId, useRef, useState } from "react"
import "./LevelAutocomplete.css"

// The search box every mode guesses through. Owns keyboard navigation and the
// combobox wiring; each mode supplies its own option markup through
// `renderOption`, which returns { className, style, content }.
function LevelAutocomplete({
  query,
  onQueryChange,
  results,
  onSelect,
  renderOption,
  listClassName = "",
  listHeader = null,
  placeholder = "Type a level name...",
  disabled = false,
  inputClassName = "",
  emptyHint = "No levels match that search.",
}) {
  const listId = useId()
  const [activeIndex, setActiveIndex] = useState(0)
  const optionRefs = useRef([])

  // A new result set invalidates the old highlight position, so snap back to
  // the top rather than leaving the cursor pointing at whatever now occupies
  // that index.
  useEffect(() => {
    setActiveIndex(0)
  }, [results])

  useEffect(() => {
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const open = results.length > 0
  const showEmpty = !open && query.trim() !== "" && !disabled

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      onQueryChange("")
      return
    }
    if (!open) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((i) => (i - 1 + results.length) % results.length)
    } else if (event.key === "Home") {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === "End") {
      event.preventDefault()
      setActiveIndex(results.length - 1)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const level = results[activeIndex]
      if (level) onSelect(level)
    }
  }

  return (
    <div className="level-autocomplete">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        value={query}
        disabled={disabled}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`level-autocomplete__input ${inputClassName}`}
      />

      {showEmpty && <p className="level-autocomplete__empty">{emptyHint}</p>}

      {open && (
        <div id={listId} role="listbox" className={listClassName}>
          {listHeader}
          {results.map((level, index) => {
            const { className = "", style, content } = renderOption(level, index)
            const active = index === activeIndex
            return (
              <div
                key={level.id}
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={active}
                tabIndex={-1}
                ref={(node) => (optionRefs.current[index] = node)}
                className={`${className}${active ? " is-active" : ""}`}
                style={style}
                onClick={() => onSelect(level)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LevelAutocomplete
