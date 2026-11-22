# Scroll areas

**Rule:** nothing scrolls through a raw `overflow-auto` / `overflow-scroll` class (or their `-x-` / `-y-` forms).
Every box that may scroll is a `<ScrollArea>` (`@workspace/ui/components/scroll-area`), and every compact row of
controls that may not fit is an `<ArrowScrollArea>`. ESLint enforces the first part (`noRawOverflow` in
`packages/config/eslint/react.mjs`): the classes are refused in any string or template literal of the React
workspaces.

## Why

- **The scrollbar should not be furniture.** A native scrollbar under every box is a grey bar on a page otherwise
  drawn with tokens, and it looks different on every system. The `ScrollArea` thumb is thin, rounded, and only there
  while scrolling, while the pointer is over the box or while the focus is inside it.
- **A box that scrolls must be reachable.** Without a tab stop, a keyboard user cannot read the end of a long list.
  The viewport becomes focusable, gets `role="region"` and its `label`, but only while the content actually
  overflows, so a box that fits adds no tab stop and no noise for a screen reader.

## What `ScrollArea` does

| Behaviour    | How                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Thumb        | Hidden native bar; a 5px rounded thumb per axis, shown while scrolling (900ms), on hover and on focus |
| Drag         | The thumb can be dragged with a mouse or a pen                                                        |
| Wheel, touch | Native scrolling of the viewport                                                                      |
| Keyboard     | Viewport is a tab stop with a visible focus ring while it overflows; arrows, Page keys, Home/End work |
| Name         | `role="region"` + `aria-label={label}` while it overflows (or your own role via `viewportProps`)      |
| Edge fades   | `fade`: the side where more content is waiting fades out                                              |

Geometry is written to the DOM from scroll and resize events; there is no React state and no re-render per frame.

```tsx
// A panel with a fixed height that scrolls down: the size on `className`, the padding on `viewportClassName`.
<ScrollArea label="Appearance options" fade className="flex-1" viewportClassName="px-5 pt-2 pb-6">
  …
</ScrollArea>
```

| Prop                | Default             | For                                                                      |
| ------------------- | ------------------- | ------------------------------------------------------------------------ |
| `axis`              | `'y'`               | `'x'`, `'y'` or `'both'`                                                 |
| `label`             |                     | Accessible name while it scrolls (omit only with `aria-labelledby`)      |
| `fade`              | `false`             | Edge fades                                                               |
| `focusable`         | `'when-scrollable'` | `'always'` for a panel that will grow, `'never'` when the items take Tab |
| `scrollbar`         | `'auto'`            | `'hidden'` for a row moved by arrows (what `ArrowScrollArea` uses)       |
| `className`         |                     | The outer box: size                                                      |
| `viewportClassName` |                     | The scrolling box: padding, background                                   |
| `viewportRef`       |                     | A ref to the scrolling element                                           |
| `viewportProps`     |                     | `id`, `role`, `aria-*` of the scrolling element                          |

## Rows that never wrap: `ArrowScrollArea`

Tabs, the segments of a `SegmentedControl`, a `ChipGroup`, a row of swatches: one line, never a visible scrollbar,
never a cut label. They already live in an `ArrowScrollArea`, so using them is enough.

- While everything fits there is nothing but the row: no arrow, no fade.
- When it overflows, two arrows are laid over the faded edges and each press moves 80% of what is visible; the arrow of
  an end that was reached fades out.
- The focused or chosen item (`aria-selected`, `aria-checked`, `aria-pressed`) is scrolled until it is whole.
- A mouse can drag the row; wheel, trackpad and touch scroll it natively.

```tsx
<ArrowScrollArea itemsLabel="filters">
  <div role="radiogroup" className="flex w-max gap-2">
    …
  </div>
</ArrowScrollArea>
```

## Do not

- Write `overflow-x-auto` "just for this one table". Wrap it.
- Put `overflow-hidden` on a `ScrollArea`'s viewport to "fix" something: clip the parent instead.
- Give two regions on the same screen the same `label`.
- Let a row of chips wrap to a second line: it is an `ArrowScrollArea`.

## Checklist

1. Does the box scroll with wheel, touch, keyboard (Tab to it, then arrows) and by dragging the thumb?
2. Idle: no thumb. Scrolling, hovering or focused: thumb.
3. With content that fits: no tab stop, no `role="region"`.
4. `npm run lint:check` passes (it fails on a raw overflow class).
