import { Injectable } from '@nestjs/common'

import { UserDataContributor } from '@domain/identity/applications/account-data/user-data-contributor'

import { NotesRepository } from '../repositories/notes.repository'

/**
 * The notes' part of rule 1.6: every note of the person goes into the export, and all of them are deleted with the
 * account. The pattern every bounded context follows: a small contributor, registered in `IdentityHttpModule`.
 */
@Injectable()
export class NotesUserData extends UserDataContributor {
  readonly section = 'notes'

  constructor(private readonly notesRepository: NotesRepository) {
    super()
  }

  async export(userId: string): Promise<Record<string, unknown>> {
    const notes = await this.notesRepository.findAllOfUser(userId)

    return {
      notes: notes.map((note) => ({
        id: note.id.toString(),
        title: note.title.value,
        body: note.body,
        pinned: note.pinned,
        archivedAt: note.archivedAt?.toISOString() ?? null,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
    }
  }

  async erase(userId: string): Promise<void> {
    await this.notesRepository.deleteAllOfUser(userId)
  }
}
