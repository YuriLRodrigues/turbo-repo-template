import { z } from 'zod'

/** The limits of rule 2.1 of the API, checked here first so most mistakes never leave the browser. */
export const NOTE_TITLE_MAX_LENGTH = 120
export const NOTE_BODY_MAX_LENGTH = 10_000

export const noteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give the note a title.')
    .max(NOTE_TITLE_MAX_LENGTH, `At most ${NOTE_TITLE_MAX_LENGTH} characters.`),
  body: z.string().max(NOTE_BODY_MAX_LENGTH, `At most ${NOTE_BODY_MAX_LENGTH.toLocaleString('en-US')} characters.`),
  pinned: z.boolean(),
})

export type NoteFormInput = z.input<typeof noteFormSchema>
export type NoteFormValues = z.output<typeof noteFormSchema>

/** Blank is "no body" for the API: the same rule as the domain, said before sending. */
export const toNotePayload = (values: NoteFormValues) => ({
  title: values.title,
  body: values.body.trim() === '' ? null : values.body,
  pinned: values.pinned,
})
