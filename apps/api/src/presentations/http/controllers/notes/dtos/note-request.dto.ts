import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

import { NOTE_BODY_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from '@domain/notes/enterprise/notes-rules'

import { PaginationQueryDto } from '../../../pagination/pagination-query.dto'
import { QueryFlag, Sent } from '../../../validation/dto-decorators'

/*
 * The DTOs check the shape only. The sizes of rule 2.1 are the domain's to check (422, `NOTE.INVALID_*`); the
 * `MaxLength` here is a generous ceiling against abuse, far above them.
 */

export class CreateNoteDto {
  @ApiProperty({ example: 'Groceries', maxLength: NOTE_TITLE_MAX_LENGTH })
  @IsString()
  @MaxLength(NOTE_TITLE_MAX_LENGTH * 4)
  title: string

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Milk\nBread',
    maxLength: NOTE_BODY_MAX_LENGTH,
    description: 'Blank or null means no body. Line breaks are kept.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_BODY_MAX_LENGTH * 2)
  body?: string | null

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean
}

/** Only what is sent changes. `body: null` clears the body; `title` cannot be cleared. */
export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Shopping', maxLength: NOTE_TITLE_MAX_LENGTH })
  @Sent()
  @IsString()
  @MaxLength(NOTE_TITLE_MAX_LENGTH * 4)
  title?: string

  @ApiPropertyOptional({ type: String, nullable: true, example: null, maxLength: NOTE_BODY_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_BODY_MAX_LENGTH * 2)
  body?: string | null

  @ApiPropertyOptional({ example: true })
  @Sent()
  @IsBoolean()
  pinned?: boolean
}

export class ListNotesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Rule 2.2: `true` lists the archive instead of the main list.', default: false })
  @QueryFlag()
  archived?: boolean

  @ApiPropertyOptional({ description: 'Case-insensitive match on the title or the body.', example: 'bread' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}
