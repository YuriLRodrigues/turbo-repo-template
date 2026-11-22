# Testing the front

| What                                   | Tool                                   | Where                                    | Run                                 |
| -------------------------------------- | -------------------------------------- | ---------------------------------------- | ----------------------------------- |
| pure helpers (`format`, `cn`)          | Vitest                                 | `packages/utils/src/*.spec.ts`           | `npm test -w @workspace/utils`      |
| the transport (refresh, locks, unwrap) | Vitest, a stubbed `fetch`              | `packages/api-client/src/http/*.spec.ts` | `npm test -w @workspace/api-client` |
| schemas, helpers of the app            | Vitest                                 | next to the file (`*.spec.ts`)           | `npm test -w web`                   |
| client components                      | Vitest + Testing Library (jsdom)       | next to the file (`*.spec.tsx`)          | `npm test -w web`                   |
| the pages in a real browser            | Playwright (`tooling/screenshots.mjs`) | `apps/web/test-results/screenshots`      | `npm run screenshots -w web`        |

`npm test` at the root runs every workspace's unit tests through Turborepo.

## Component tests

```tsx
vi.mock('next/navigation', () => ({ useRouter: () => router, useSearchParams: () => new URLSearchParams() }))
vi.mock('@/components/session/session-provider', () => ({ useSession: () => session }))

it('says in place that the credentials are wrong', async () => {
  session.signIn.mockRejectedValue(new ApiError({ statusCode: 401, code: 'AUTH.INVALID_CREDENTIALS', message: '…' }))
  const { user } = renderWithProviders(<SignInForm />)

  await user.type(screen.getByLabelText('E-mail'), 'jane@example.com')
  // ...
  expect(await screen.findByRole('alert')).toHaveTextContent('The e-mail or the password is not right.')
})
```

- `renderWithProviders` (`apps/web/test/render.tsx`) gives the component a fresh query client and a `user`.
- Query by role and label, the way a person (and a screen reader) finds things; never by class name.
- Mock the edges (router, session, the generated function), not the component under test.

## Screenshots

With the API and the web preview running:

```bash
npm run dev:api                 # terminal 1: the API on :3500 (PGlite, no .env)
npm run build -w web && npm run preview -w web   # terminal 2: the export on :3501
npm run screenshots -w web      # terminal 3
```

The tool signs up a fresh account through the UI, writes a note, and takes desktop and phone pictures of every screen
in both themes. It fails on a console error, a failed request or a page wider than the screen
(`test-results/screenshots/report.json`). Those pictures are how a visual change is judged before a PR.
