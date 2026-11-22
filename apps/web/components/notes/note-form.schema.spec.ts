import { describe, expect, it } from 'vitest'

import { noteFormSchema, toNotePayload } from './note-form.schema'

describe('noteFormSchema', () => {
  it('trims the title and accepts an empty body', () => {
    const result = noteFormSchema.parse({ title: '  Groceries ', body: '', pinned: false })

    expect(result).toEqual({ title: 'Groceries', body: '', pinned: false })
  })

  it('asks for a title and keeps both limits of the API', () => {
    expect(noteFormSchema.safeParse({ title: '   ', body: '', pinned: false }).error?.issues[0]?.message).toBe(
      'Give the note a title.',
    )
    expect(noteFormSchema.safeParse({ title: 'a'.repeat(121), body: '', pinned: false }).success).toBe(false)
    expect(noteFormSchema.safeParse({ title: 'Long', body: 'a'.repeat(10_001), pinned: false }).success).toBe(false)
  })
})

describe('toNotePayload', () => {
  it('sends a blank body as no body', () => {
    expect(toNotePayload({ title: 'Groceries', body: '   ', pinned: true })).toEqual({
      title: 'Groceries',
      body: null,
      pinned: true,
    })
  })
})
