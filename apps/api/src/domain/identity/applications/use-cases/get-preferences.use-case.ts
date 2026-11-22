import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { type Either, right } from '@core/logic/either'

import { Preferences } from '../../enterprise/entities/preferences.entity'
import { PreferencesRepository } from '../repositories/preferences.repository'

export type GetPreferencesInput = {
  actor: Actor
}

export type GetPreferencesOutput = Either<never, { preferences: Preferences }>

/** Rule 1.7. A person who never changed anything gets the defaults. */
@Injectable()
export class GetPreferencesUseCase {
  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  async execute({ actor }: GetPreferencesInput): Promise<GetPreferencesOutput> {
    const preferences =
      (await this.preferencesRepository.findByUserId(actor.id)) ?? Preferences.defaultsFor(new UniqueEntityId(actor.id))

    return right({ preferences })
  }
}
