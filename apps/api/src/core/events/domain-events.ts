import type { AggregateRoot } from '../domain/aggregate-root'
import type { UniqueEntityId } from '../domain/unique-entity-id'
import type { DomainEvent } from './domain-event'

export type DomainEventHandler<E extends DomainEvent = DomainEvent> = (event: E) => void | Promise<void>

/**
 * In-process event bus. Aggregates mark themselves when they raise an event; repositories call
 * `dispatchEventsForAggregate` after a successful write. Handlers are awaited one by one, so a subscriber must catch
 * its own errors if a failing side effect should not fail the request that triggered it.
 */
export class DomainEvents {
  private static handlers = new Map<string, DomainEventHandler[]>()
  private static markedAggregates: AggregateRoot<unknown>[] = []

  static markAggregateForDispatch(aggregate: AggregateRoot<unknown>): void {
    if (!this.findMarkedAggregate(aggregate.id)) {
      this.markedAggregates.push(aggregate)
    }
  }

  static async dispatchEventsForAggregate(id: UniqueEntityId): Promise<void> {
    const aggregate = this.findMarkedAggregate(id)
    if (!aggregate) return

    const events = [...aggregate.domainEvents]
    aggregate.clearEvents()
    this.markedAggregates = this.markedAggregates.filter((marked) => !marked.id.equals(id))

    for (const event of events) {
      for (const handler of this.handlers.get(event.constructor.name) ?? []) {
        await handler(event)
      }
    }
  }

  /** Registers a handler for an event class name and returns a function that removes it. */
  static register<E extends DomainEvent>(handler: DomainEventHandler<E>, eventName: string): () => void {
    const registered = handler as DomainEventHandler
    this.handlers.set(eventName, [...(this.handlers.get(eventName) ?? []), registered])

    return () => {
      this.handlers.set(
        eventName,
        (this.handlers.get(eventName) ?? []).filter((current) => current !== registered),
      )
    }
  }

  static clearHandlers(): void {
    this.handlers.clear()
  }

  static clearMarkedAggregates(): void {
    this.markedAggregates = []
  }

  private static findMarkedAggregate(id: UniqueEntityId): AggregateRoot<unknown> | undefined {
    return this.markedAggregates.find((aggregate) => aggregate.id.equals(id))
  }
}
