'use client'

import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon, PinIcon, PinOffIcon, Trash2Icon } from 'lucide-react'

import type { NoteResponseDto } from '@workspace/api-client/models'
import { Badge } from '@workspace/ui/components/badge'
import { IconButton } from '@workspace/ui/components/icon-button'
import { cn } from '@workspace/ui/lib/cn'
import { formatRelativeTime } from '@workspace/utils'

import { useArchiveNote, useUpdateNote } from '@/components/notes/use-notes'

type NoteCardProps = {
  note: NoteResponseDto
  onEdit: () => void
  onDelete: () => void
}

/** One note of the list: its title, the start of its body and what can be done with it. */
export const NoteCard = ({ note, onEdit, onDelete }: NoteCardProps) => {
  const pin = useUpdateNote()
  const archive = useArchiveNote()
  const archived = note.archivedAt !== null

  const actions = [
    !archived && {
      label: note.pinned ? 'Unpin' : 'Pin',
      icon: note.pinned ? <PinOffIcon /> : <PinIcon />,
      onClick: () => pin.mutate({ id: note.id, pinned: !note.pinned }),
      disabled: pin.isPending,
    },
    !archived && { label: 'Edit', icon: <PencilIcon />, onClick: onEdit },
    {
      label: archived ? 'Restore' : 'Archive',
      icon: archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />,
      onClick: () => archive.mutate({ id: note.id, archived: !archived }),
      disabled: archive.isPending,
    },
    { label: 'Delete', icon: <Trash2Icon />, onClick: onDelete },
  ].filter((action) => action !== false)

  return (
    <article
      className={cn(
        'flex h-full min-w-0 flex-col gap-3 rounded-(--radius-card) surface p-4',
        archived && 'bg-transparent shadow-none',
      )}
    >
      <header className="flex min-w-0 items-start justify-between gap-2">
        <h2 className="min-w-0 font-display text-[0.9375rem] leading-snug font-semibold break-words">{note.title}</h2>
        {note.pinned && (
          <Badge tone="primary" icon={<PinIcon aria-hidden />}>
            Pinned
          </Badge>
        )}
      </header>
      {note.body && <p className="line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">{note.body}</p>}
      <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
        <time dateTime={note.updatedAt} className="text-xs text-muted-foreground">
          {archived ? 'Archived ' : 'Changed '}
          {formatRelativeTime(note.updatedAt)}
        </time>
        <div className="-mr-1.5 flex items-center">
          {actions.map((action) => (
            <IconButton
              key={action.label}
              variant="ghost"
              size="sm"
              label={`${action.label}: ${note.title}`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon}
            </IconButton>
          ))}
        </div>
      </footer>
    </article>
  )
}
