# CLAUDE.md — packages/ui

The design system of both apps, consumed as source (TypeScript and CSS): `@workspace/ui/components/<name>`,
`@workspace/ui/charts`, `@workspace/ui/appearance`, `@workspace/ui/styles.css`. Read
`docs/patterns/web/design-system.md` and `docs/patterns/web/charts.md` first.

```bash
npm run lint:check -w @workspace/ui
npm run typecheck -w @workspace/ui
npm run contrast                       # from the root: every text token on every surface, both themes, every accent
```

## Rules

1. `src/styles/tokens.css` is the only place a color, a radius or a shadow is written. Its rules are parsed by
   `tooling/contrast-check.mjs`: literal `oklch()` values or `var(--token)`, blocks of `:root` plus attribute
   selectors. Run `npm run contrast` after any change; keep `THEME_COLORS` in `appearance/options.ts` in sync (the
   tool says when not).
2. The appearance lists (`appearance/options.ts`) are also the API's (`apps/api/.../preferences/appearance.ts`): change
   both; a unit spec of the API compares them.
3. Primitives are built on Base UI with the shadcn names and anatomy; default labels are English and overridable.
4. Charts are Recharts, colored only with token variables; text over colored shapes uses `HALO`.
5. A frame that holds something wide is `min-w-0` (`Card`, `ChartFrame`), and nothing scrolls through a raw overflow
   class (`ScrollArea`, `ArrowScrollArea`).
6. Pure helpers that are not about React or the DOM belong to `@workspace/utils`.
7. The brand is `bg-brand`, `text-brand` and `brand-backdrop` (`src/styles/brand.css`), on the `--brand-*` tokens:
   marks, display words and the ground behind a hero. Body text and controls use the roles (`primary`, `muted`...).
