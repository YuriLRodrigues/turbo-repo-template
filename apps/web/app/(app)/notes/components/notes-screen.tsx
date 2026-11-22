'use client'

import { useDeferredValue, useState } from 'react'

import { ChevronLeftIcon, ChevronRightIcon, NotebookPenIcon, PlusIcon, SearchIcon } from 'lucide-react'

import type { NoteResponseDto } from '@workspace/api-client/models'
import { Button } from '@workspace/ui/components/button'
import { ConfirmDialog } from '@workspace/ui/components/dialog'
import { EmptyState } from '@workspace/ui/components/empty-state'
import { IconButton } from '@workspace/ui/components/icon-button'
import { Input } from '@workspace/ui/components/input'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Tabs, TabsList, TabsTab } from '@workspace/ui/components/tabs'

import { NoteSheet } from '@/components/notes/note-sheet'
import { useDeleteNote, useNotes } from '@/components/notes/use-notes'
import { PageHeader } from '@/components/shell/page-header'
import { useShell } from '@/components/shell/shell-context'

import { NoteCard } from './note-card'

const PAGE_SIZE = 12

type View = 'active' | 'archived'

/**
 * The example screen of the template, end to end: a list read from the API (search, two views, pages), and every
 * change the API offers (write, edit, pin, archive, delete), each one a mutation that refreshes the list.
 */
export const NotesScreen = () => {
  const { openNewNote } = useShell()
  const [view, setView] = useState<View>('active')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<NoteResponseDto | null>(null)
  const [deleting, setDeleting] = useState<NoteResponseDto | null>(null)
  // The list follows the search box without a request per key stroke being shown out of order.
  const term = useDeferredValue(search.trim())

  const notes = useNotes({ page, limit: PAGE_SIZE, archived: view === 'archived', search: term || undefined })
  const remove = useDeleteNote({ onSuccess: () => setDeleting(null) })
  const results = notes.data?.results ?? []
  const meta = notes.data?.meta

  const changeView = (next: View) => {
    setView(next)
    setPage(1)
  }

  return (
    <>
      <PageHeader
        title="Notes"
        description="Pinned first, then the most recently changed."
        actions={
          <>
            <div className="relative min-w-0 flex-1 md:w-64 md:flex-none">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                aria-label="Search notes"
                placeholder="Search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Button onClick={openNewNote} className="hidden md:inline-flex">
              <PlusIcon aria-hidden />
              New note
            </Button>
          </>
        }
      />

      <Tabs value={view} onValueChange={(next) => changeView(next as View)} className="mb-5">
        <TabsList label="Which notes">
          <TabsTab value="active">Active</TabsTab>
          <TabsTab value="archived">Archived</TabsTab>
        </TabsList>
      </Tabs>

      {notes.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-(--radius-card)" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<NotebookPenIcon />}
          title={term ? 'Nothing matches the search' : view === 'archived' ? 'The archive is empty' : 'No notes yet'}
          description={
            term
              ? 'Try another word: the search looks in the titles and in the bodies.'
              : view === 'archived'
                ? 'Archived notes wait here, read-only, until you bring them back.'
                : 'Write the first one: a title is enough.'
          }
          action={
            !term && view === 'active' ? (
              <Button onClick={openNewNote}>
                <PlusIcon aria-hidden />
                New note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul
          aria-busy={notes.isFetching || undefined}
          className="grid grid-cols-1 gap-4 transition-opacity aria-busy:opacity-70 sm:grid-cols-2 xl:grid-cols-3"
        >
          {results.map((note) => (
            <li key={note.id} className="min-w-0">
              <NoteCard note={note} onEdit={() => setEditing(note)} onDelete={() => setDeleting(note)} />
            </li>
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-3">
          <IconButton label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {meta.page} of {meta.totalPages}
          </span>
          <IconButton
            label="Next page"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </nav>
      )}

      <NoteSheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} note={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete the note?"
        description={deleting ? `"${deleting.title}" will be deleted for good. This cannot be undone.` : undefined}
        confirmLabel="Delete"
        tone="destructive"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  )
}
