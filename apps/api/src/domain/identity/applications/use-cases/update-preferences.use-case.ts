import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import {
  Preferences,
  type PreferencesChanges,
  type PreferencesError,
} from '../../enterprise/entities/preferences.entity'
import { PreferencesRepository } from '../repositories/preferences.repository'

export type UpdatePreferencesInput = {
  actor: Actor
  /** Only what is present changes, at every level. */
  changes: PreferencesChanges
}

export type UpdatePreferencesOutput = Either<PreferencesError, { preferences: Preferences }>

/** Rule 1.7: appearance, time zone, order of the home blocks, reminders and the state of the step-by-step. */
@Injectable()
export class UpdatePreferencesUseCase {
  constructor(
    private readonly preferencesRepository: PreferencesRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, changes }: UpdatePreferencesInput): Promise<UpdatePreferencesOutput> {
    const preferences =
      (await this.preferencesRepository.findByUserId(actor.id)) ?? Preferences.defaultsFor(new UniqueEntityId(actor.id))

    const changed = preferences.change(changes, this.clock.now())
    if (changed.isLeft()) return left(changed.value)

    await this.preferencesRepository.save(preferences)

    return right({ preferences })
  }
}
