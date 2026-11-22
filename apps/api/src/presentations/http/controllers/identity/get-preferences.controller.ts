import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { GetPreferencesUseCase } from '@domain/identity/applications/use-cases/get-preferences.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { PreferencesResponseDto } from './dtos/preferences.dto'
import { PreferencesViewModel } from './view-models/preferences.view-model'

@ApiTags('me')
@Controller('me/preferences')
export class GetPreferencesController {
  constructor(private readonly getPreferences: GetPreferencesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'My preferences',
    description:
      'Rule 1.7: appearance, time zone, order of the home blocks, reminders and the state of the welcome ' +
      'step-by-step. A person who never changed anything gets the defaults.',
  })
  @ApiOkResponse({ type: PreferencesResponseDto })
  @ApiPrivate()
  async handle(@CurrentActor() actor: Actor): Promise<PreferencesResponseDto> {
    const result = await this.getPreferences.execute({ actor })

    return PreferencesViewModel.toHttp(result.value.preferences)
  }
}
