/**
 * A value without identity: equal when its props are equal. Immutable — build a new one instead of changing it.
 * Validation lives in a static `create()` that returns `Either`, so an invalid value never exists.
 */
export abstract class ValueObject<Props extends Record<string, unknown>> {
  protected readonly props: Readonly<Props>

  protected constructor(props: Props) {
    this.props = Object.freeze({ ...props })
  }

  equals(other: ValueObject<Record<string, unknown>>): boolean {
    return other.constructor === this.constructor && JSON.stringify(other.props) === JSON.stringify(this.props)
  }
}
