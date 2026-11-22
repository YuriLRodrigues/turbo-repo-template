import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MaxLength } from 'class-validator'

/** Shape only. The business limits (rules 0.8 and 1.1) are checked by the use case and answer 422. */
export class SignUpDto {
  @ApiProperty({ example: 'Jane Doe', description: '1 to 60 characters after trimming.' })
  @IsString()
  @MaxLength(200)
  name: string

  @ApiProperty({ example: 'jane@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email: string

  /** bcrypt only reads the first 72 bytes. */
  @ApiProperty({ example: 'secret123', description: '8 characters or more.', minLength: 8, maxLength: 72 })
  @IsString()
  @MaxLength(72)
  password: string
}
