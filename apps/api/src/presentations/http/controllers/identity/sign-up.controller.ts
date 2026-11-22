import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { RegisterUserUseCase } from '@domain/identity/applications/use-cases/register-user.use-case'
import { NAME_MAX_LENGTH } from '@core/text/text'
import { PASSWORD_MIN_LENGTH } from '@domain/identity/enterprise/identity-rules'
import { EmailAlreadyInUseError } from '@domain/identity/errors/email-already-in-use.error'
import { InvalidEmailError } from '@domain/identity/errors/invalid-email.error'
import { InvalidUserNameError } from '@domain/identity/errors/invalid-user-name.error'
import { WeakPasswordError } from '@domain/identity/errors/weak-password.error'

import { Public } from '../../auth/public.decorator'
import { ApiErrors } from '../../errors/api-errors.decorator'
import { SignUpDto } from './dtos/sign-up.dto'
import { UserResponseDto } from './dtos/user-response.dto'
import { UserViewModel } from './view-models/user.view-model'

@ApiTags('auth')
@Controller('auth/sign-up')
export class SignUpController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post()
  @Public()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create an account',
    description:
      'Rules 1.1 and 1.2. Creates the account and sends the link that confirms the e-mail (valid for 24 hours). ' +
      'The person can use the app before confirming. Sign in afterwards with `POST /auth/sign-in`.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiErrors(
    'validation',
    new EmailAlreadyInUseError(),
    new InvalidUserNameError(NAME_MAX_LENGTH),
    new InvalidEmailError(),
    new WeakPasswordError(PASSWORD_MIN_LENGTH),
    'rate-limited',
  )
  async handle(@Body() body: SignUpDto): Promise<UserResponseDto> {
    const result = await this.registerUser.execute(body)

    if (result.isLeft()) throw result.value

    return UserViewModel.toHttp(result.value.user)
  }
}
