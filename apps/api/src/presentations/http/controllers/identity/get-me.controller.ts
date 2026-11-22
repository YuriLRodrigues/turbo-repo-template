import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { GetUserProfileUseCase } from '@domain/identity/applications/use-cases/get-user-profile.use-case'
import { UserNotFoundError } from '@domain/identity/errors/user-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { UserResponseDto } from './dtos/user-response.dto'
import { UserViewModel } from './view-models/user.view-model'

@ApiTags('me')
@Controller('me')
export class GetMeController {
  constructor(private readonly getUserProfile: GetUserProfileUseCase) {}

  @Get()
  @ApiOperation({ summary: 'The signed-in person' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiPrivate(new UserNotFoundError())
  async handle(@CurrentActor() actor: Actor): Promise<UserResponseDto> {
    const result = await this.getUserProfile.execute({ userId: actor.id })

    if (result.isLeft()) throw result.value

    return UserViewModel.toHttp(result.value.user)
  }
}
