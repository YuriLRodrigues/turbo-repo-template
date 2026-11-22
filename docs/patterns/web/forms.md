# Forms

react-hook-form, validated by a zod schema that lives next to the form, submitted through a mutation.

## The schema

```ts
// components/notes/note-form.schema.ts
export const noteFormSchema = z.object({
  title: z.string().trim().min(1, 'Give the note a title.').max(120, 'At most 120 characters.'),
  body: z.string().max(10_000, 'At most 10,000 characters.'),
  pinned: z.boolean(),
})
```

- The limits mirror the rules of the API, so most mistakes never leave the browser. The API stays the authority: it
  checks again and answers 422 with a stable code.
- Messages are product copy: what to do, not what went wrong ("Give the note a title.").
- The schema has a unit spec (`*.schema.spec.ts`), and so does any function that turns form values into the payload
  (`toNotePayload`: a blank body is `null`).

## The form

```tsx
const form = useAppForm(noteFormSchema, { defaultValues: { title: '', body: '', pinned: false } })
const create = useCreateNote({ onSuccess: close })

<form noValidate onSubmit={(event) => void form.handleSubmit((values) => create.mutate(toNotePayload(values)))(event)}>
  <ControlledInput control={form.control} name="title" label="Title" />
  <ControlledTextarea control={form.control} name="body" label="Body" />
  <ControlledSwitch control={form.control} name="pinned" label="Pin to the top" />
  <Button type="submit" loading={create.isPending}>Save note</Button>
</form>
```

- `useAppForm` (`components/form/use-app-form.ts`) validates on submit and then on every change. Validating on blur
  moves the layout under the pointer and can swallow the click on the submit button.
- The controlled fields (`components/form/controlled-fields.tsx`) wire the label, the value, `aria-invalid`,
  `aria-describedby` and the error message (`FieldError`, announced with `role="alert"`).
- `noValidate`: the browser's own bubbles would compete with the messages of the schema.
- Every field has a visible label; a placeholder is an example, not a name. `autoComplete` is set (`email`,
  `current-password`, `new-password`, `name`).
- An error of the API that belongs to a field goes to that field (`form.setError('email', ...)`), with the code in
  `silentCodes` so no toast repeats it. One that belongs to the form goes under it (`FieldError`).
- A form in a sheet resets when the sheet opens: what was typed and abandoned is not kept.
