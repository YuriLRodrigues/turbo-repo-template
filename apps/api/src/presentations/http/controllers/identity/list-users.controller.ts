import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ListUsersUseCase } from '@domain/identity/applications/use-cases/list-users.use-case'

import { Roles } from '../../auth/roles.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { PaginationQueryDto } from '../../pagination/pagination-query.dto'
import { UsersPageResponseDto } from './dtos/user-response.dto'
import { UserViewModel } from './view-models/user.view-model'

@ApiTags('users')
@Controller('users')
export class ListUsersController {
  constructor(private readonly listUsers: ListUsersUseCase) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List the accounts (admins only)', description: 'Newest first.' })
  @ApiOkResponse({ type: UsersPageResponseDto })
  @ApiPrivate('validation', 'forbidden')
  async handle(@Query() query: PaginationQueryDto): Promise<UsersPageResponseDto> {
    const result = await this.listUsers.execute({ page: query.page, limit: query.limit })

    return UserViewModel.toHttpPage(result.value.users)
  }
}
