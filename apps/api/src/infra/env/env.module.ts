import { Global, Module } from '@nestjs/common'

import { parseEnv } from './env'
import { EnvService } from './env.service'

@Global()
@Module({
  providers: [{ provide: EnvService, useFactory: () => new EnvService(parseEnv(process.env)) }],
  exports: [EnvService],
})
export class EnvModule {}
