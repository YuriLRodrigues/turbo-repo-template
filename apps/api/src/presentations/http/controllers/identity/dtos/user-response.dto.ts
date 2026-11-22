import { ApiProperty } from '@nestjs/swagger'

import { type Role, roles } from '@core/auth/actor'

import { PaginationMetaDto } from '../../../pagination/pagination-meta.dto'

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'Jane Doe' })
  name: string

  @ApiProperty({ example: 'jane@example.com' })
  email: string

  @ApiProperty({ enum: roles, example: 'USER' })
  role: Role

  @ApiProperty({ description: 'Rule 1.2: false until the link sent by e-mail is opened.', example: false })
  emailVerified: boolean

  @ApiProperty({ format: 'date-time' })
  createdAt: string
}

export class UsersPageResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  results: UserResponseDto[]

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto
}
