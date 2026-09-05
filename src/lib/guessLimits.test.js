import { describe, it, expect } from 'vitest'
import { maxGuessesFor } from './guessLimits'

describe('maxGuessesFor', () => {
    it('returns the configured budget per difficulty', () => {
        expect(maxGuessesFor('easy')).toBe(20)
        expect(maxGuessesFor('hard')).toBe(40)
    })

    it('falls back to hard when unknown input', () => {
        expect(maxGuessesFor('harder')).toBe(40)
        expect(maxGuessesFor(undefined)).toBe(40)
    })
})