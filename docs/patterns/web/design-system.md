# Design system

`packages/ui` is the design system of both apps: tokens on Tailwind v4, primitives on Base UI with the shadcn
anatomy, the charts, and the appearance store. It is neutral on purpose: a product gives itself a face by changing
the tokens and the font, not the components.

## Tokens

`src/styles/tokens.css` is the only place a color, a radius or a shadow is written. Components use roles:

| Role                                                     | For                                                       |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `background`, `foreground`                               | the page and its text                                     |
| `card`, `popover`                                        | surfaces (cards, sheets, menus, tooltips)                 |
| `muted`, `muted-foreground`                              | wells, quiet text                                         |
| `primary`, `primary-foreground`                          | the accent the person picked: the main button, the switch |
| `primary-text`, `primary-soft`                           | the accent as text on a surface, the accent as a tint     |
| `success`, `warning`, `destructive` (+ `-text`, `-soft`) | statuses                                                  |
| `border`, `border-strong`, `ring`                        | lines and the focus ring                                  |
| `chart-1` … `chart-5`                                    | the series of the charts                                  |

Materials are utilities (`src/styles/surfaces.css`): `surface` (a card), `well` (sunk into a surface: inputs,
tracks, chips) and `raised` (standing out of it: the thumb of a segmented control).

Every text token is checked against every surface it can sit on, in both themes and every accent:
`npm run contrast` (`tooling/contrast-check.mjs`, WCAG AA 4.5:1). It reads `tokens.css` itself, so a token changed
without checking fails there. The same tool checks that the `theme-color` of `appearance/options.ts` follows
`--bg-base`.

To rebrand: change the values of `tokens.css` (keep the names), the fonts in the root layouts, `app/icon.svg` and
`config/site.ts`; run `npm run contrast`.

## Appearance

What a person can choose (`src/appearance/options.ts`): theme (system, light, dark), accent (six), density
(comfortable, compact) and "reduce motion". The choice is on `<html>` as `data-*` attributes, written **before the
first paint** by `BOOT_SCRIPT` (in `<head>` of both apps), stored on the device, and, when signed in, saved in the
account (`PATCH /me/preferences`) and applied on every device (`usePreferencesSync`). The lists are the API's too:
a unit spec of the API fails when they drift apart.

`AppearanceControls` is the panel of controls, the same in the sheet of the shell and in the settings screen.

## Primitives

`src/components/`: `Button`, `IconButton`, `Input` + `Label`, `Textarea`, `Field` + `FieldError`, `Switch`, `Badge`,
`Card`, `Dialog` + `ConfirmDialog`, `Sheet`, `Tooltip`, `Kbd`, `Tabs`, `SegmentedControl`, `Chip` + `ChipGroup`,
`ScrollArea`, `ArrowScrollArea`, `Sidebar`, `TabBar`, `Skeleton`, `Spinner`, `Progress`, `Disclosure`, `EmptyState`,
`Toaster`.

- Built on Base UI (focus, keyboard and ARIA come from there) with the shadcn names and anatomy, so a block copied
  from shadcn lands on the same tokens.
- Components are arrow functions in a `const`, with named exports (lint).
- An icon-only control has a `label` (its accessible name and tooltip).
- Interactive things answer the hand: a short press scale, a hover state, the global focus ring. Motion respects
  reduced motion (system setting or the appearance switch) through one rule in `base.css`.

## Adding a component

1. Copy the shadcn source (or write it) into `packages/ui/src/components/<name>.tsx`.
2. Replace raw colors with roles, `rounded-*` with `rounded-(--radius-control)` / `rounded-(--radius-card)`, shadows
   with `shadow-elevation-*`, raw overflow with `ScrollArea`.
3. English copy for every default label (`closeLabel = 'Close'`), overridable by props.
4. `npm run lint:check -w @workspace/ui`, `npm run typecheck`, then use it from an app.
