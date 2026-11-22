import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { Encrypter } from '@domain/identity/applications/cryptography/encrypter'
import { HashComparer } from '@domain/identity/applications/cryptography/hash-comparer'
import { HashGenerator } from '@domain/identity/applications/cryptography/hash-generator'
import { OpaqueTokens } from '@domain/identity/applications/cryptography/opaque-tokens'
import { EnvService } from '@infra/env/env.service'

import { BcryptHasher } from './bcrypt-hasher'
import { CryptoOpaqueTokens } from './crypto-opaque-tokens'
import { JwtEncrypter } from './jwt-encrypter'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.get('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: env.get('JWT_EXPIRES_IN_SECONDS') },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  providers: [
    BcryptHasher,
    { provide: HashGenerator, useExisting: BcryptHasher },
    { provide: HashComparer, useExisting: BcryptHasher },
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: OpaqueTokens, useClass: CryptoOpaqueTokens },
  ],
  exports: [HashGenerator, HashComparer, Encrypter, OpaqueTokens, JwtModule],
})
export class CryptographyModule {}
