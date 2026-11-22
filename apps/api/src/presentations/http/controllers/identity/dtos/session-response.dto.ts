import { ApiProperty } from '@nestjs/swagger'

import { PaginationMetaDto } from '../../../pagination/pagination-meta.dto'

export class SessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ description: 'True for the session this request was made with.', example: true })
  current: boolean

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The `User-Agent` of the device, as it identified itself.',
    example: 'Mozilla/5.0 (Android 16; Mobile; rv:147.0) Gecko/147.0 Firefox/147.0',
  })
  userAgent: string | null

  @ApiProperty({ format: 'date-time', description: 'When the person signed in.' })
  createdAt: string

  @ApiProperty({ format: 'date-time', description: 'When the session was last renewed.' })
  lastUsedAt: string

  @ApiProperty({ format: 'date-time', description: 'When it ends if it is not renewed (30 days after the last use).' })
  expiresAt: string
}

export class SessionsPageResponseDto {
  @ApiProperty({ type: [SessionResponseDto] })
  results: SessionResponseDto[]

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto
}
