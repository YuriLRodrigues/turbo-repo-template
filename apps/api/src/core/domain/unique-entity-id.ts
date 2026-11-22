import { randomUUID } from 'node:crypto'

/** Identity of an entity. Generates a UUID v4 when none is given (new entity). */
export class UniqueEntityId {
  private readonly value: string

  constructor(value?: string) {
    this.value = value ?? randomUUID()
  }

  toString(): string {
    return this.value
  }

  toValue(): string {
    return this.value
  }

  equals(id: UniqueEntityId): boolean {
    return id.toValue() === this.value
  }
}
