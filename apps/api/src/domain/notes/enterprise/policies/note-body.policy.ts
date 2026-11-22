import { type Either, left, right } from '@core/logic/either'
import { cleanOptionalText } from '@core/text/text'

import { InvalidNoteBodyError } from '../../errors/invalid-note-body.error'
import { NOTE_BODY_MAX_LENGTH } from '../notes-rules'

/** Rule 2.1: blank means "no body" (`null`), the ends are trimmed, the line breaks inside are kept. */
export function parseNoteBody(raw: string | null | undefined): Either<InvalidNoteBodyError, string | null> {
  const body = cleanOptionalText(raw, NOTE_BODY_MAX_LENGTH)

  return body.valid ? right(body.value) : left(new InvalidNoteBodyError(NOTE_BODY_MAX_LENGTH))
}
