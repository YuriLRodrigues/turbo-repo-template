import { afterEach, describe, expect, it, vi } from 'vitest'

import { AggregateRoot } from '../domain/aggregate-root'
import type { UniqueEntityId } from '../domain/unique-entity-id'
import type { DomainEvent } from './domain-event'
import { DomainEvents } from './domain-events'

class SampleCreatedEvent implements DomainEvent {
  readonly occurredAt = new Date()

  constructor(readonly aggregate: SampleAggregate) {}

  getAggregateId(): UniqueEntityId {
    return this.aggregate.id
  }
}

class SampleAggregate extends AggregateRoot<Record<string, never>> {
  static create(): SampleAggregate {
    const aggregate = new SampleAggregate({})
    aggregate.addDomainEvent(new SampleCreatedEvent(aggregate))
    return aggregate
  }
}

describe('DomainEvents', () => {
  afterEach(() => {
    DomainEvents.clearHandlers()
    DomainEvents.clearMarkedAggregates()
  })

  it('dispatches the events of a marked aggregate to its handlers and clears them', async () => {
    const handler = vi.fn()
    DomainEvents.register(handler, SampleCreatedEvent.name)
    const aggregate = SampleAggregate.create()

    expect(aggregate.domainEvents).toHaveLength(1)

    await DomainEvents.dispatchEventsForAggregate(aggregate.id)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(expect.any(SampleCreatedEvent))
    expect(aggregate.domainEvents).toHaveLength(0)
  })

  it('dispatches each event only once', async () => {
    const handler = vi.fn()
    DomainEvents.register(handler, SampleCreatedEvent.name)
    const aggregate = SampleAggregate.create()

    await DomainEvents.dispatchEventsForAggregate(aggregate.id)
    await DomainEvents.dispatchEventsForAggregate(aggregate.id)

    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not dispatch before the aggregate is marked', async () => {
    const handler = vi.fn()
    DomainEvents.register(handler, SampleCreatedEvent.name)
    const aggregate = SampleAggregate.create()
    DomainEvents.clearMarkedAggregates()

    await DomainEvents.dispatchEventsForAggregate(aggregate.id)

    expect(handler).not.toHaveBeenCalled()
  })

  it('stops calling a handler after it is unregistered', async () => {
    const handler = vi.fn()
    const unregister = DomainEvents.register(handler, SampleCreatedEvent.name)
    unregister()

    await DomainEvents.dispatchEventsForAggregate(SampleAggregate.create().id)

    expect(handler).not.toHaveBeenCalled()
  })
})
