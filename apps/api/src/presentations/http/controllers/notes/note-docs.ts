import { InvalidNoteBodyError } from '@domain/notes/errors/invalid-note-body.error'
import { InvalidNoteTitleError } from '@domain/notes/errors/invalid-note-title.error'
import { NOTE_BODY_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from '@domain/notes/enterprise/notes-rules'

/** The errors of rule 2.1, documented the same way by the two routes that take the fields of a note. */
export const NOTE_FIELD_ERRORS = [
  new InvalidNoteTitleError(NOTE_TITLE_MAX_LENGTH),
  new InvalidNoteBodyError(NOTE_BODY_MAX_LENGTH),
]
