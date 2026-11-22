import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SessionTokensResponseDto {
  @ApiProperty({
    description: 'Send it as `Authorization: Bearer <accessToken>`. Keep it in memory only.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIuLi4ifQ.signature',
  })
  accessToken: string

  @ApiProperty({ description: 'Seconds until the access token expires (rule 1.3: 15 minutes).', example: 900 })
  expiresIn: number

  @ApiPropertyOptional({
    description:
      'Only with `x-auth-transport: token` (native apps): keep it in secure storage and send it back in ' +
      '`x-refresh-token`. With the default transport the refresh token travels in an httpOnly cookie and is not here.',
    example: 'q3Zr0Jm3z1p0Yk8n6g2sWc5vT7uXb9dLf4hA1eRiOoM',
  })
  refreshToken?: string
}
