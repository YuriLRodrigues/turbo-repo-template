import { Injectable } from '@nestjs/common'

import type { AccountLinks } from '@domain/identity/applications/mail/account-links'
import { EnvService } from '@infra/env/env.service'

/** The pages of the web app that receive the links. The web app owns the pages; these paths are the contract. */
export const VERIFY_EMAIL_PATH = '/verify-email'
export const RESET_PASSWORD_PATH = '/reset-password'

@Injectable()
export class WebAccountLinks implements AccountLinks {
  readonly appName: string
  private readonly base: string

  constructor(env: EnvService) {
    this.appName = env.get('APP_NAME')
    this.base = env.get('WEB_APP_URL').replace(/\/+$/, '')
  }

  emailVerification(token: string): string {
    return `${this.base}${VERIFY_EMAIL_PATH}?token=${encodeURIComponent(token)}`
  }

  passwordReset(token: string): string {
    return `${this.base}${RESET_PASSWORD_PATH}?token=${encodeURIComponent(token)}`
  }
}
