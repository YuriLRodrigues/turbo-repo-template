import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'
import type { CalendarDate } from '@core/time/calendar-date'
import { Clock, UserCalendar } from '@core/time/clock'

import { UserNotFoundError } from '../../errors/user-not-found.error'
import { type UserDataExport, UserDataContributors } from '../account-data/user-data-contributor'
import { UsersRepository } from '../repositories/users.repository'

export type ExportUserDataInput = {
  actor: Actor
}

export type ExportUserDataOutput = Either<
  UserNotFoundError,
  {
    document: UserDataExport
    /** The day of the export in the person's time zone (rule 0.2): the date in the name of the file. */
    exportedOn: CalendarDate
  }
>

/** Rule 1.6: everything the person has in the app, as one JSON document. Each bounded context writes its part. */
@Injectable()
export class ExportUserDataUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly contributors: UserDataContributors,
    private readonly userCalendar: UserCalendar,
    private readonly clock: Clock,
  ) {}

  async execute({ actor }: ExportUserDataInput): Promise<ExportUserDataOutput> {
    if (!(await this.usersRepository.findById(actor.id))) return left(new UserNotFoundError())

    const data: UserDataExport['data'] = {}
    for (const contributor of this.contributors.inOrder) {
      data[contributor.section] = await contributor.export(actor.id)
    }

    return right({
      document: { format: 'app.export', version: 1, exportedAt: this.clock.now().toISOString(), data },
      exportedOn: await this.userCalendar.today(actor.id),
    })
  }
}
