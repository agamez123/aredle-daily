import { LEVELS } from "./levels"

// Easy Mode only pulls from the Pointercrate-equivalent top of the list.
export const EASY_MODE_LIMIT = 150

export const MODE_POOLS = {
  hard: LEVELS,
  easy: LEVELS.filter((level) => level.position <= EASY_MODE_LIMIT),
}
