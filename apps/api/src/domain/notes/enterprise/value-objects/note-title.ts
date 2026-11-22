import { ValueObject } from '@core/domain/value-object'
import { type Either, left, right } from '@core/logic/either'
import { cleanName } from '@core/text/text'

import { InvalidNoteTitleError } from '../../errors/invalid-note-title.error'
import { NOTE_TITLE_MAX_LENGTH } from '../notes-rules'

type NoteTitleProps = { value: string }

/** Rule 2.1: trimmed, inner whitespace collapsed, 1 to 120 characters. */
export class NoteTitle extends ValueObject<NoteTitleProps> {
  private constructor(props: NoteTitleProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  static create(raw: string): Either<InvalidNoteTitleError, NoteTitle> {
    const value = cleanName(raw, NOTE_TITLE_MAX_LENGTH)
    if (value === null) return left(new InvalidNoteTitleError(NOTE_TITLE_MAX_LENGTH))

    return right(new NoteTitle({ value }))
  }

  /** Rebuilds a title that was validated before (read from the database). */
  static restore(value: string): NoteTitle {
    return new NoteTitle({ value })
  }

  override toString(): string {
    return this.props.value
  }
}
