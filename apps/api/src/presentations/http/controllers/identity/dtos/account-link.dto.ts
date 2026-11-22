import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

const TOKEN_EXAMPLE = 'q3Zr0Jm3z1p0Yk8n6g2sWc5vT7uXb9dLf4hA1eRiOoM'

export class VerifyEmailDto {
  @ApiProperty({ description: 'The `token` of the link that was sent by e-mail.', example: TOKEN_EXAMPLE })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  token: string
}

/** No format rules: any text gets the same answer, so the route does not say which addresses have an account. */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsString()
  @MaxLength(254)
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'The `token` of the link that was sent by e-mail.', example: TOKEN_EXAMPLE })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  token: string

  @ApiProperty({ example: 'a-new-secret', description: '8 characters or more.', minLength: 8, maxLength: 72 })
  @IsString()
  @MaxLength(72)
  password: string
}

export class DeleteUserAccountDto {
  @ApiProperty({ example: 'secret123', description: 'The current password, asked again before deleting.' })
  @IsString()
  @MaxLength(72)
  password: string
}
