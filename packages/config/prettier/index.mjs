/**
 * The one Prettier style of the monorepo. The root `prettier.config.mjs` spreads it and adds the Tailwind class
 * sorting for the workspaces that write Tailwind classes.
 */
export const base = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  printWidth: 120,
  endOfLine: 'lf',
}

/**
 * Options for files that contain Tailwind classes. `stylesheet` is the CSS entry that imports Tailwind and the
 * design tokens (`apps/web/app/globals.css`): the plugin reads it to know the order of the utilities.
 */
export const tailwind = (stylesheet) => ({
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: stylesheet,
  tailwindFunctions: ['cn', 'cva'],
})

export default base
