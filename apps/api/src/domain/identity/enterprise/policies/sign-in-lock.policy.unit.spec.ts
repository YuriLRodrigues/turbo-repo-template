import { describe, expect, it } from 'vitest'

import { signInLockedUntil } from './sign-in-lock.policy'

const at = (minutes: number, seconds = 0): Date => new Date(Date.UTC(2026, 10, 14, 12, minutes, seconds))

describe('signInLockedUntil (rule 1.4)', () => {
  it('does not block before the fifth wrong password', () => {
    expect(signInLockedUntil([], at(0))).toBeNull()
    expect(signInLockedUntil([at(0), at(1), at(2), at(3)], at(4))).toBeNull()
  })

  it('blocks for 15 minutes counted from the fifth wrong password', () => {
    const failures = [at(0), at(1), at(2), at(3), at(4)]

    expect(signInLockedUntil(failures, at(4, 1))).toEqual(at(19))
    expect(signInLockedUntil(failures, at(18, 59))).toEqual(at(19))
  })

  it('lets attempts through again when the 15 minutes are over', () => {
    const failures = [at(0), at(1), at(2), at(3), at(4)]

    expect(signInLockedUntil(failures, at(19))).toBeNull()
    expect(signInLockedUntil(failures, at(25))).toBeNull()
  })

  it('needs the five failures inside 15 minutes', () => {
    // The first and the fifth are 16 minutes apart: only four fall in any 15-minute window.
    expect(signInLockedUntil([at(0), at(13), at(14), at(15), at(16)], at(16, 1))).toBeNull()
    // Exactly 15 minutes apart still counts.
    expect(signInLockedUntil([at(0), at(12), at(13), at(14), at(15)], at(15, 1))).toEqual(at(30))
  })

  it('counts a window that slides, not one that restarts at the first failure', () => {
    // Failures at 0 and 14, then 15:30, 16, 17 and 18: the last five are within four minutes.
    const failures = [at(0), at(14), at(15, 30), at(16), at(17), at(18)]

    expect(signInLockedUntil(failures, at(18, 1))).toEqual(at(33))
  })

  it('starts a new count after a block: old failures do not block again', () => {
    const failures = [at(0), at(1), at(2), at(3), at(4), at(20)]

    expect(signInLockedUntil(failures, at(20, 1))).toBeNull()
  })

  it('does not depend on the order the failures come in', () => {
    expect(signInLockedUntil([at(4), at(0), at(3), at(1), at(2)], at(5))).toEqual(at(19))
  })
})
