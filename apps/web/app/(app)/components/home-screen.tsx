'use client'

import Link from 'next/link'

import { ArrowRightIcon, MailIcon, PinIcon } from 'lucide-react'

import { unwrap } from '@workspace/api-client'
import { resendEmailVerification } from '@workspace/api-client/gen/endpoints/auth'
import type { NoteResponseDto } from '@workspace/api-client/models'
import { CartesianChart, Indicator } from '@workspace/ui/charts'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { EmptyState } from '@workspace/ui/components/empty-state'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { formatNumber, formatRelativeTime } from '@workspace/utils'

import { useNotes } from '@/components/notes/use-notes'
import { useSession } from '@/components/session/session-provider'
import { PageHeader } from '@/components/shell/page-header'
import { useShell } from '@/components/shell/shell-context'
import { useApiMutation } from '@/lib/use-api-mutation'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** How many of these notes were written on each day of the week: a chart from real data, computed here. */
const notesByWeekday = (notes: readonly NoteResponseDto[]) =>
  WEEKDAYS.map((day, index) => ({
    day,
    notes: notes.filter((note) => new Date(note.createdAt).getDay() === index).length,
  }))

/** The last seven days, oldest first: how many notes changed on each. */
const lastSevenDays = (notes: readonly NoteResponseDto[], now = new Date()) =>
  Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(now)
    day.setDate(now.getDate() - (6 - offset))

    return notes.filter((note) => new Date(note.updatedAt).toDateString() === day.toDateString()).length
  })

const VerifyEmailCard = () => {
  const resend = useApiMutation(() => unwrap(resendEmailVerification()), {
    successMessage: 'We sent the link again. Check your inbox.',
  })

  return (
    <Card className="border-warning/40 bg-warning-soft">
      <CardHeader
        title="Confirm your e-mail"
        description="We sent you a link when you signed up. Open it to confirm that the address is yours."
        action={
          <Button variant="secondary" size="sm" loading={resend.isPending} onClick={() => resend.mutate()}>
            <MailIcon aria-hidden />
            Send again
          </Button>
        }
      />
    </Card>
  )
}

/**
 * The first screen after signing in: a few numbers about the notes, the pinned ones and a chart. Everything comes
 * from the notes list of the API (the example context): a real product puts its own summary here.
 */
export const HomeScreen = () => {
  const { user } = useSession()
  const { openNewNote } = useShell()
  const active = useNotes({ limit: 100 })
  const archived = useNotes({ limit: 1, archived: true })
  const notes = active.data?.results ?? []
  const pinned = notes.filter((note) => note.pinned)
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description="Here is where your notes stand."
        actions={
          <Button variant="secondary" render={<Link href="/notes" />}>
            All notes
            <ArrowRightIcon aria-hidden />
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        {user && !user.emailVerified && <VerifyEmailCard />}

        {/* Three equal tracks that never grow with their content (the lesson of docs/patterns/web/layout.md). */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Notes',
              value: active.data?.meta.totalItems,
              series: lastSevenDays(notes),
              caption: 'Changed in the last 7 days',
            },
            { title: 'Pinned', value: pinned.length, caption: 'Always on top of the list' },
            { title: 'Archived', value: archived.data?.meta.totalItems, caption: 'Out of the way, kept' },
          ].map((stat) => (
            <Card key={stat.title}>
              <CardContent>
                {stat.value === undefined ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <Indicator
                    title={stat.title}
                    value={formatNumber(stat.value)}
                    caption={stat.caption}
                    series={stat.series}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card>
            <CardHeader title="When you write" description="Notes by the day of the week they were written." />
            <CardContent>
              {active.isPending ? (
                <Skeleton className="h-60 w-full" />
              ) : (
                <CartesianChart
                  data={notesByWeekday(notes)}
                  x="day"
                  series={[{ key: 'notes', label: 'Notes' }]}
                  type="bar"
                  palette="accent"
                  allowDecimals={false}
                  label="Notes by the day of the week they were written"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Pinned" description="The notes you keep at hand." />
            <CardContent>
              {active.isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : pinned.length === 0 ? (
                <EmptyState
                  icon={<PinIcon />}
                  title="Nothing pinned yet"
                  description="Pin a note to keep it here and at the top of the list."
                  action={
                    <Button size="sm" onClick={openNewNote}>
                      Write a note
                    </Button>
                  }
                  className="py-6"
                />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {pinned.slice(0, 5).map((note) => (
                    <li key={note.id} className="flex min-w-0 items-baseline justify-between gap-3 py-2.5">
                      <span className="truncate text-sm font-medium">{note.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(note.updatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
