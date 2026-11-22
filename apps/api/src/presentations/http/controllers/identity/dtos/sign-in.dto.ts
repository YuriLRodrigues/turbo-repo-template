import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength } from 'class-validator'

/** No format rules here: a malformed e-mail is just wrong credentials (401), never a hint (400). */
export class SignInDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsString()
  @MaxLength(254)
  email: string

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MaxLength(72)
  password: string
}
