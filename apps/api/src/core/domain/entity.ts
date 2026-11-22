import { UniqueEntityId } from './unique-entity-id'

/**
 * Something with identity: two entities are the same when their ids are equal, whatever their props.
 * Subclasses expose props through getters and change them only through intention-revealing methods.
 */
export abstract class Entity<Props> {
  private readonly _id: UniqueEntityId
  protected props: Props

  protected constructor(props: Props, id?: UniqueEntityId) {
    this.props = props
    this._id = id ?? new UniqueEntityId()
  }

  get id(): UniqueEntityId {
    return this._id
  }

  equals(entity: Entity<unknown>): boolean {
    return entity === this || entity.id.equals(this._id)
  }
}
