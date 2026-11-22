import { ValueObject } from '@core/domain/value-object'
import { type Either, left, right } from '@core/logic/either'

import { InvalidEmailError } from '../../errors/invalid-email.error'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LENGTH = 254

type EmailProps = { value: string }

/** Lower-cased and trimmed, so `Jane@Example.com ` and `jane@example.com` are the same account. */
export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  static create(raw: string): Either<InvalidEmailError, Email> {
    const value = raw.trim().toLowerCase()

    if (value.length > MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
      return left(new InvalidEmailError())
    }

    return right(new Email({ value }))
  }

  /** Rebuilds an e-mail that was validated before (read from the database). */
  static restore(value: string): Email {
    return new Email({ value })
  }

  override toString(): string {
    return this.props.value
  }
}
