---
name: new-web-screen
description: Add a screen to the Next.js static-export web app, wired to the generated API client - route under app/(app), query hooks with unwrap and query keys, mutations with useApiMutation, a form with useAppForm and a zod schema, loading/empty/error states, navigation entry and tests. Use when the user asks for a new page, list, detail or form in the web app.
---

# New web screen

The notes screen is the reference: `apps/web/app/(app)/notes/` (page + `components/`), `components/notes/use-notes.ts`
(hooks), `components/notes/note-sheet.tsx` + `note-form.schema.ts` (form). Patterns: `docs/patterns/web/`.

1. **Contract.** The endpoints must exist in `packages/api-client/src/gen/endpoints/<tag>.ts`. If not, add them to the
   API first (`new-api-route`) and run `npm run api:openapi && npm run api:client`. Never hand-write a fetch or a DTO
   type.
2. **Keys and hooks.** Add the resource's keys to `apps/web/lib/query-keys.ts` (resource first). Write
   `components/<resource>/use-<resource>.ts`: `useQuery({ queryKey, queryFn: () => unwrap(fn(params)) })` for reads
   (`placeholderData: keepPreviousData` for lists), and `useApiMutation((input) => unwrap(fn(input)), options)` for
   writes, whose `onSuccess` invalidates the resource key.
3. **Route.** `app/(app)/<route>/page.tsx` exports `metadata` and renders `<RouteScreen />` from
   `./components/<route>-screen.tsx` (`'use client'`). A page reading `useSearchParams` wraps it in `<Suspense>`.
   Start with `PageHeader` (title, description, actions).
4. **States.** Loading (`Skeleton` with the shape), empty (`EmptyState` with the way to start), filtered-empty, errors
   (toast from `useApiMutation`; inline for codes the screen handles, listed in `silentCodes`). Numbers come from the
   response `meta`.
5. **Forms.** A zod schema next to the form (`*.schema.ts`) mirroring the API's limits, `useAppForm(schema)`, the
   controlled fields, `noValidate`, the submit `loading={mutation.isPending}`, API field errors through
   `form.setError`.
6. **Layout.** Grids with sized tracks (`grid-cols-1`, `minmax(0, …)`), `min-w-0` on flex children with wide content,
   `ScrollArea`/`ArrowScrollArea` for anything that may scroll, charts from `@workspace/ui/charts` inside a `Card`.
7. **Navigation.** A line in `components/shell/navigation.ts` (sidebar and tab bar read it) or a link from where
   people reach the screen.
8. **Tests.** A spec for the schema and for any helper; a component spec (`*.spec.tsx`, `renderWithProviders`) for a
   client component with logic. Then the screenshots with the API and the preview running
   (`npm run screenshots -w web`) and look at the pictures.
9. Run the `pre-pr-checklist` skill.
