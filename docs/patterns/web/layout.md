# Layout

## A track sized by its content widens instead of fitting

This is the lesson worth keeping (it cost three fixes in the project the template came from):

> A grid or flex item whose track is automatic is sized by its content. A chart with a width, a row of icons or a tall
> drawing then **widens the track instead of fitting into it**, and the card around it cuts what does not fit.

So:

- Give every grid a size for its tracks: `grid-cols-1`, `grid-rows-1`, `grid-cols-[minmax(0,3fr)_minmax(0,2fr)]`.
  `minmax(0, 1fr)` is the important part: plain `1fr` means `minmax(auto, 1fr)`, whose minimum is the content.
- A flex child that holds something wide gets `min-w-0` (and `flex-1` when it should take the rest).
- A card is `min-w-0` already (`Card`), and so is the frame of every chart (`ChartFrame`): the chart measures the box
  (`ResponsiveContainer`) and follows it, never the other way around.
- A long word (a URL, an e-mail) is `truncate` or `break-words`, never left to push the layout.
- When a drawing must be bigger than its box, take it out of the flow (`absolute`) or put it in a `ScrollArea`.

The screenshots tool (`apps/web/tooling/screenshots.mjs`) fails when a page is wider than the screen, which is how
this bug shows up most of the time.

## The shell

`components/shell/app-shell.tsx` is what is around every signed-in screen:

| Width           | Navigation                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------ |
| under 768px     | a tab bar above the bottom edge, with the main action ("+") docked at its end                    |
| 768px to 1023px | a rail of icons; opening it lays the sidebar over the content (Escape or a press outside closes) |
| 1024px and up   | the sidebar pushes the content; Ctrl/⌘+B opens and closes it and the choice is remembered        |

The state of the sidebar is on `<html>` before the first paint (`lib/sidebar-state.ts` + `BOOT_SCRIPT`), so nothing
moves on load. `SidebarInset` gives way to it.

A screen starts with `PageHeader` (the one `h1`, a description, the actions) and lays out its content with grids
that follow the rule above. The content ends above the tab bar and the home indicator (`pb-[calc(env(safe-area-inset-bottom)+6.5rem)]`
in the shell), and starts below the notch (`viewport-fit=cover` in the root layout).

## Widths that matter

- 375px (a small phone): nothing scrolls sideways, every row of controls is an `ArrowScrollArea`.
- 768px: the sidebar arrives as a rail.
- 1024px: the sidebar pushes; two-column grids (`lg:`) start.
- 1280px and up: the content stops at `max-w-6xl` and centres.
