import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import type { AccessTokenPayload, Encrypter } from '@domain/identity/applications/cryptography/encrypter'

@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(private readonly jwtService: JwtService) {}

  encrypt(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload)
  }
}
