import { ApiProperty } from '@nestjs/swagger'

export class UserDataExportDto {
  @ApiProperty({ example: 'app.export', description: 'Identifies the file.' })
  format: string

  @ApiProperty({ example: 1, description: 'Changes when the shape of a section changes.' })
  version: number

  @ApiProperty({ format: 'date-time' })
  exportedAt: string

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'object', additionalProperties: true },
    description:
      'One section per area of the app, each written by the area that owns the data: `identity` (profile, ' +
      'preferences, sessions) and `notes` (every note, archived ones included). Passwords and tokens are never here.',
    example: {
      identity: { profile: { name: 'Jane Doe', email: 'jane@example.com' }, preferences: null, sessions: [] },
      notes: { notes: [] },
    },
  })
  data: Record<string, Record<string, unknown>>
}
