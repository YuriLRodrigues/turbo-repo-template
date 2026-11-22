/** A subscriber: registers its handlers in `DomainEvents` when the app boots. */
export interface EventHandler {
  setupSubscriptions(): void
}
