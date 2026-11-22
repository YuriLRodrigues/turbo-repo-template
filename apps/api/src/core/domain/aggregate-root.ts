import type { DomainEvent } from '../events/domain-event'
import { DomainEvents } from '../events/domain-events'
import { Entity } from './entity'

/**
 * Entry point of a consistency boundary. It collects domain events while it changes; the repository dispatches
 * them after persisting (`DomainEvents.dispatchEventsForAggregate`), so subscribers never see unsaved state.
 */
export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = []

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
    DomainEvents.markAggregateForDispatch(this)
  }

  clearEvents(): void {
    this._domainEvents = []
  }
}
