import { Controller, Get, Header, Res } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'

import type { Actor } from '@core/auth/actor'
import { ExportUserDataUseCase } from '@domain/identity/applications/use-cases/export-user-data.use-case'
import { UserNotFoundError } from '@domain/identity/errors/user-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { UserDataExportDto } from './dtos/user-data-export.dto'

@ApiTags('me')
@Controller('me/export')
export class ExportUserDataController {
  constructor(private readonly exportUserData: ExportUserDataUseCase) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Download everything that is mine',
    description:
      'Rule 1.6. One JSON document with all the data of the person, sent as a file: ' +
      "`Content-Disposition: attachment; filename=account-export-<day>.json`, the day in the person's time zone. " +
      'Every bounded context writes its own section of `data`; secrets (password, tokens) are never in it.',
  })
  @ApiOkResponse({ type: UserDataExportDto })
  @ApiPrivate(new UserNotFoundError())
  async handle(
    @CurrentActor() actor: Actor,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDataExportDto> {
    const result = await this.exportUserData.execute({ actor })

    if (result.isLeft()) throw result.value

    const { document, exportedOn } = result.value
    response.attachment(`account-export-${exportedOn}.json`)
    response.type('application/json')

    return document
  }
}
