'use client'

import { useEffect } from 'react'

import type { NoteResponseDto } from '@workspace/api-client/models'
import { Button } from '@workspace/ui/components/button'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Sheet, SheetContent, SheetFooter, SheetHeader } from '@workspace/ui/components/sheet'

import { ControlledInput, ControlledSwitch, ControlledTextarea } from '@/components/form/controlled-fields'
import { useAppForm } from '@/components/form/use-app-form'

import { noteFormSchema, toNotePayload } from './note-form.schema'
import { useCreateNote, useUpdateNote } from './use-notes'

type NoteSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The note to edit. Without one, the sheet writes a new note. */
  note?: NoteResponseDto | null
}

const EMPTY = { title: '', body: '', pinned: false }

/** Writes a new note or edits one: the same form, in a sheet over whatever screen is open. */
export const NoteSheet = ({ open, onOpenChange, note }: NoteSheetProps) => {
  const editing = Boolean(note)
  const form = useAppForm(noteFormSchema, { defaultValues: EMPTY })
  const close = () => onOpenChange(false)
  const create = useCreateNote({ onSuccess: close })
  const update = useUpdateNote({ onSuccess: close, successMessage: 'Note updated' })
  const pending = create.isPending || update.isPending

  // Every time the sheet opens it starts from the note (or empty): what was typed and abandoned is not kept.
  useEffect(() => {
    if (open) form.reset(note ? { title: note.title, body: note.body ?? '', pinned: note.pinned } : EMPTY)
  }, [open, note, form])

  const submit = form.handleSubmit((values) => {
    const payload = toNotePayload(values)
    if (note) update.mutate({ id: note.id, ...payload })
    else create.mutate(payload)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader title={editing ? 'Edit note' : 'New note'} />
        <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col" noValidate>
          <ScrollArea label="Note" className="min-h-0 flex-1" viewportClassName="flex flex-col gap-5 px-5 py-2 sm:px-6">
            <ControlledInput control={form.control} name="title" label="Title" autoComplete="off" autoFocus />
            <ControlledTextarea control={form.control} name="body" label="Body" rows={6} />
            <ControlledSwitch
              control={form.control}
              name="pinned"
              label="Pin to the top"
              description="Pinned notes come first in the list."
            />
          </ScrollArea>
          <SheetFooter>
            <Button type="submit" loading={pending}>
              {editing ? 'Save changes' : 'Save note'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
