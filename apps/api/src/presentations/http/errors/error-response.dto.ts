import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/** The body of every error response, whatever produced it. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number

  @ApiProperty({ example: 'USER.NOT_FOUND', description: 'Stable, machine-readable. Clients branch on it.' })
  code: string

  @ApiProperty({ example: 'User not found.', description: 'For a person reading a log. Never branch on it.' })
  message: string

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { origin: { kind: 'instalment', id: '7c9e6679-7425-40de-944b-e07fc1f90ae7' } },
    description:
      'What a client needs to react to this code, when the code has something to say: the origin of a linked ' +
      'entry, how long to wait, which limit was reached. The example of each code shows its shape.',
  })
  details?: Record<string, unknown>
}
