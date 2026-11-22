import { Module } from '@nestjs/common'

import { EnvModule } from '@infra/env/env.module'
import { EventsModule } from '@infra/events/events.module'
import { HttpModule } from '@presentations/http/http.module'

@Module({
  imports: [EnvModule, EventsModule, HttpModule],
})
export class AppModule {}
