import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'
import { and, asc, eq, gte, lt } from 'drizzle-orm'

import type { SignInAttemptsRepository } from '@domain/identity/applications/repositories/sign-in-attempts.repository'

import { DrizzleService } from '../drizzle.service'
import { signInAttempts } from '../schema/sign-in-attempts'

@Injectable()
export class DrizzleSignInAttemptsRepository implements SignInAttemptsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async recordFailure(email: string, at: Date): Promise<void> {
    await this.drizzle.db.insert(signInAttempts).values({ id: randomUUID(), email, attemptedAt: at })
  }

  async findFailuresSince(email: string, since: Date): Promise<Date[]> {
    const rows = await this.drizzle.db
      .select({ attemptedAt: signInAttempts.attemptedAt })
      .from(signInAttempts)
      .where(and(eq(signInAttempts.email, email), gte(signInAttempts.attemptedAt, since)))
      .orderBy(asc(signInAttempts.attemptedAt))

    return rows.map((row) => row.attemptedAt)
  }

  async clear(email: string): Promise<void> {
    await this.drizzle.db.delete(signInAttempts).where(eq(signInAttempts.email, email))
  }

  async deleteOlderThan(email: string, before: Date): Promise<void> {
    await this.drizzle.db
      .delete(signInAttempts)
      .where(and(eq(signInAttempts.email, email), lt(signInAttempts.attemptedAt, before)))
  }
}
