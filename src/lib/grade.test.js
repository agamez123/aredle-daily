import { it, expect } from 'vitest'
import { gradeGuess } from './grade'

const answer = {
    position: 100, version: '2.1', song: 'A', creator: 'X', verifier: 'Y', tags: ['a','b']
}

it('marks an exact match correct across all columns', () => {
    const g = gradeGuess({ ...answer }, answer, 'hard')
    expect(g.position.status).toBe('correct')
    expect(g.song.status).toBe('correct')
    expect(g.tags.status).toBe('correct')
})

it('points the arrow the right way for position (list rankings)', () => {
    // guessing #50 when the answer is #100 would point arrow down towards answer
    const g = gradeGuess({ ...answer, position: 50 }, answer, 'hard')
    expect(g.position.direction).toBe('down')
})

it('treats a missing version as unknown or NaN', () => {
    const g = gradeGuess({ ...answer, version: '' }, answer, 'hard')
    expect(g.version.status).toBe('unknown')
})

it('gives partial credit for overlapping tags', () => {
    expect(gradeGuess({ ...answer, tags: ['a', 'z'] }, answer, 'hard').tags.status).toBe('close')
    expect(gradeGuess({ ...answer, tags: ['z'] }, answer, 'hard').tags.status).toBe('wrong')
})