import { Body, Controller, Patch } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { UpdatePreferencesUseCase } from '@domain/identity/applications/use-cases/update-preferences.use-case'
import { accents } from '@domain/identity/enterprise/preferences/appearance'
import { InvalidAppearanceError } from '@domain/identity/errors/invalid-appearance.error'
import { InvalidOnboardingError } from '@domain/identity/errors/invalid-onboarding.error'
import { InvalidTimeZoneError } from '@domain/identity/errors/invalid-time-zone.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { PreferencesResponseDto, UpdatePreferencesDto } from './dtos/preferences.dto'
import { PreferencesViewModel } from './view-models/preferences.view-model'

@ApiTags('me')
@Controller('me/preferences')
export class UpdatePreferencesController {
  constructor(private readonly updatePreferences: UpdatePreferencesUseCase) {}

  @Patch()
  @ApiOperation({
    summary: 'Change my preferences',
    description:
      'Rule 1.7. Only what is sent changes, at every level: `{ "appearance": { "theme": "dark" } }` keeps the ' +
      'accent and everything else. Either every change in the request is applied or none is.',
  })
  @ApiOkResponse({ type: PreferencesResponseDto, description: 'The preferences after the change.' })
  @ApiPrivate(
    'validation',
    new InvalidAppearanceError('accent', accents),
    new InvalidTimeZoneError(),
    new InvalidOnboardingError('the step "profile" cannot be both completed and skipped'),
  )
  async handle(@CurrentActor() actor: Actor, @Body() body: UpdatePreferencesDto): Promise<PreferencesResponseDto> {
    const result = await this.updatePreferences.execute({ actor, changes: body })

    if (result.isLeft()) throw result.value

    return PreferencesViewModel.toHttp(result.value.preferences)
  }
}
