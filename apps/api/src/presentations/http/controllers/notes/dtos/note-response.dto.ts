import { ApiProperty } from '@nestjs/swagger'

import { PaginationMetaDto } from '../../../pagination/pagination-meta.dto'

export class NoteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'Groceries' })
  title: string

  @ApiProperty({ type: String, nullable: true, example: 'Milk\nBread' })
  body: string | null

  @ApiProperty({ example: false, description: 'Rule 2.3: pinned notes come first.' })
  pinned: boolean

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Rule 2.2: set while the note is archived (read-only).',
  })
  archivedAt: string | null

  @ApiProperty({ format: 'date-time' })
  createdAt: string

  @ApiProperty({ format: 'date-time' })
  updatedAt: string
}

export class NotesPageResponseDto {
  @ApiProperty({ type: [NoteResponseDto] })
  results: NoteResponseDto[]

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto
}
