/** Makes the keys `K` of `T` optional: `Optional<NoteProps, 'createdAt'>`. */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
