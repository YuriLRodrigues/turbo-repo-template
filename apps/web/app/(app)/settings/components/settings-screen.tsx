'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { DownloadIcon, LogOutIcon, MailIcon, Trash2Icon } from 'lucide-react'
import { z } from 'zod'

import { unwrap } from '@workspace/api-client'
import { resendEmailVerification } from '@workspace/api-client/gen/endpoints/auth'
import { deleteUserAccount, exportUserData } from '@workspace/api-client/gen/endpoints/me'
import { AppearanceControls } from '@workspace/ui/components/appearance-controls'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@workspace/ui/components/dialog'
import { formatDate } from '@workspace/utils'

import { useSaveAppearance } from '@/components/appearance/use-preferences-sync'
import { ControlledInput } from '@/components/form/controlled-fields'
import { useAppForm } from '@/components/form/use-app-form'
import { useSession } from '@/components/session/session-provider'
import { PageHeader } from '@/components/shell/page-header'
import { useApiMutation } from '@/lib/use-api-mutation'

const deleteAccountSchema = z.object({ password: z.string().min(1, 'Enter your password to confirm.') })

/** Rule 1.6 of the API: the account is deleted with everything in it, after the password is asked again. */
const DeleteAccountDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const router = useRouter()
  const { signOut } = useSession()
  const form = useAppForm(deleteAccountSchema, { defaultValues: { password: '' } })
  const remove = useApiMutation((password: string) => unwrap(deleteUserAccount({ password })), {
    successMessage: 'Your account was deleted.',
    silentCodes: ['USER.WRONG_PASSWORD'],
    onSuccess: async () => {
      await signOut()
      router.replace('/sign-in/')
    },
    onError: (error) => {
      if (error.code === 'USER.WRONG_PASSWORD') form.setError('password', { message: 'The password is not right.' })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Delete your account?"
        description="Your notes, your preferences and your sessions are deleted for good. This cannot be undone."
      >
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => void form.handleSubmit(({ password }) => remove.mutate(password))(event)}
        >
          <ControlledInput
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" disabled={remove.isPending} />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" loading={remove.isPending}>
              Delete my account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Downloads everything the account has, as the JSON file the API writes (rule 1.6). */
const downloadExport = async () => {
  const document = await unwrap(exportUserData())
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' })
  const link = Object.assign(window.document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `account-export-${new Date().toISOString().slice(0, 10)}.json`,
  })
  link.click()
  URL.revokeObjectURL(link.href)
}

/** The account: who is signed in, the look, the data, and the way out. */
export const SettingsScreen = () => {
  const router = useRouter()
  const { user, signOut } = useSession()
  const saveAppearance = useSaveAppearance()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const resend = useApiMutation(() => unwrap(resendEmailVerification()), {
    successMessage: 'We sent the link again. Check your inbox.',
  })
  const exportData = useApiMutation(downloadExport, { successMessage: 'Your data was downloaded.' })

  if (!user) return null

  return (
    <>
      <PageHeader title="Settings" description="Your account, the look of the app and your data." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" description={`Member since ${formatDate(user.createdAt, { style: 'long' })}.`} />
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="truncate font-medium">{user.name}</dd>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-medium">{user.email}</span>
                {user.emailVerified ? (
                  <Badge tone="success">Confirmed</Badge>
                ) : (
                  <Badge tone="warning">Not confirmed</Badge>
                )}
              </dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              {!user.emailVerified && (
                <Button variant="secondary" size="sm" loading={resend.isPending} onClick={() => resend.mutate()}>
                  <MailIcon aria-hidden />
                  Send the confirmation again
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void signOut().then(() => router.replace('/sign-in/'))}
              >
                <LogOutIcon aria-hidden />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Appearance" description="Changes at once and follows your account." />
          <CardContent>
            <AppearanceControls onChange={saveAppearance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Your data" description="Everything the account has, as one JSON file." />
          <CardContent>
            <Button variant="secondary" size="sm" loading={exportData.isPending} onClick={() => exportData.mutate()}>
              <DownloadIcon aria-hidden />
              Download my data
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader title="Delete the account" description="The account and everything in it, for good." />
          <CardContent>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon aria-hidden />
              Delete my account
            </Button>
          </CardContent>
        </Card>
      </div>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}
