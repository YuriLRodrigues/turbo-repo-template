/**
 * Runs `work` atomically: every repository call made inside it commits together or not at all. Use it when a use
 * case writes more than one row that must agree (the instalments of a purchase, a password change that ends the
 * sessions, an account being erased).
 *
 * - Throwing inside `work` rolls everything back. Returning a `Left` commits like any other value, so decide
 *   before writing.
 * - Calls can be nested: the inner one is a savepoint of the outer one.
 *
 * The abstract class is the DI token: infra binds the Drizzle transaction, tests use `FakeUnitOfWork`.
 */
export abstract class UnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>
}
