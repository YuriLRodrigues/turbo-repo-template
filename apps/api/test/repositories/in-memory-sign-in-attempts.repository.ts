import type { SignInAttemptsRepository } from '@domain/identity/applications/repositories/sign-in-attempts.repository'

export class InMemorySignInAttemptsRepository implements SignInAttemptsRepository {
  failures: { email: string; at: Date }[] = []

  async recordFailure(email: string, at: Date): Promise<void> {
    this.failures.push({ email, at })
  }

  async findFailuresSince(email: string, since: Date): Promise<Date[]> {
    return this.failures
      .filter((failure) => failure.email === email && failure.at.getTime() >= since.getTime())
      .map((failure) => failure.at)
      .sort((a, b) => a.getTime() - b.getTime())
  }

  async clear(email: string): Promise<void> {
    this.failures = this.failures.filter((failure) => failure.email !== email)
  }

  async deleteOlderThan(email: string, before: Date): Promise<void> {
    this.failures = this.failures.filter(
      (failure) => failure.email !== email || failure.at.getTime() >= before.getTime(),
    )
  }
}
