import { describe, it, expect } from 'vitest'
import { getDayIndex, getPuzzleNumber, pickDailyLevel, formatCountdown } from './daily'

describe('getDayIndex', () => {
    it('is 0 on the epoch date', () => {
        expect(getDayIndex(new Date(2026, 7, 29))).toBe(0)
    })

    it('counts whole local days forward', () => {
        expect(getDayIndex(new Date(2026, 7, 30))).toBe(1)
        expect(getPuzzleNumber(getDayIndex(new Date(2026, 7, 29)))).toBe(1)
    })
})

describe('pickDailyLevel', () => {
     const pool = Array.from({ length: 10 }, (_, i) => ({ id: i }))

     it('is deterministic for the same day/mode/difficulty', () => {
        const a = pickDailyLevel(pool, 'classic', 'hard', 3)
        const b = pickDailyLevel(pool, 'classic', 'hard', 3)
        expect(a).toEqual(b)
     })

     it('never repeats a level within one pass of the pool', () => {
        const seen = new Set()
        for (let day = 0; day < pool.length; day++) {
            seen.add(pickDailyLevel(pool, 'classic', 'hard', day).id)
        }
        expect(seen.size).toBe(pool.length)
     })

     it('gives different sequences to different mode/difficulty pairs', () => {
        // Not guaranteed different on every index but the full sequence MUST DIFFER
        const seq = (mode) => Array.from({ length: 10 }, (_, d) => pickDailyLevel(pool, mode, 'hard', d).id)
        expect(seq('classic')).not.toEqual(seq('rounds'))
     })

     it('handles negative day inidices (pre-epoch)', () => {
        expect(pickDailyLevel(pool, 'classic', 'hard', -1)).toBeDefined()
     })

     it('returns null for an empty pool', () => {
        expect(pickDailyLevel([], 'classic', 'hard', 0)).toBeNull()
     })
})


describe('formatCountdown', () => {
    it('clamps negatives to zero', () => {
        expect(formatCountdown(-192837987)).toBe('00:00:00')
    })

    it('formats h:m:s with padding', () => {
        expect(formatCountdown((3 * 3600 + 4 * 60 + 9) * 1000)).toBe('03:04:09')
    })
})