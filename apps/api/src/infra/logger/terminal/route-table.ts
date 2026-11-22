import { padEndVisible, visibleWidth } from './ansi'
import type { RenderContext } from './banner'

/** Who reaches the route: `@Public()`, `@Roles(...)`, or just the bearer token of the global guard. */
export type RouteAccess = { kind: 'public' } | { kind: 'roles'; roles: readonly string[] } | { kind: 'authenticated' }

export type RouteInfo = {
  method: string
  path: string
  /** Controller class, without the `Controller` suffix. */
  controller: string
  access: RouteAccess
}

function accessText(access: RouteAccess, { painter, palette }: RenderContext): string {
  if (access.kind === 'public') return painter.paint('public', palette.hint)
  if (access.kind === 'roles') return painter.paint(access.roles.join(', '), palette.warn)

  return painter.paint('jwt', palette.muted)
}

/** Sorted by path, then method, so a resource's routes stay together. */
export function sortRoutes(routes: readonly RouteInfo[]): RouteInfo[] {
  const order = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  const rank = (method: string) => (order.includes(method) ? order.indexOf(method) : order.length)

  return [...routes].sort((a, b) => a.path.localeCompare(b.path) || rank(a.method) - rank(b.method))
}

/**
 * The routes the app mapped, one per line, with who can call each:
 *
 *    GET     /notes/:id            jwt      GetNote
 *    GET     /users                ADMIN    ListUsers
 */
export function renderRouteTable(routes: readonly RouteInfo[], ctx: RenderContext): string[] {
  const { painter, palette } = ctx
  const sorted = sortRoutes(routes)
  const pathWidth = Math.max(0, ...sorted.map((route) => route.path.length))
  const accessWidth = Math.max(0, ...sorted.map((route) => accessText(route.access, ctx)).map(visibleWidth))

  const count = `${sorted.length} ${sorted.length === 1 ? 'route' : 'routes'}`

  return [
    ` ${painter.paint('routes', palette.strong)} ${painter.paint(`· ${count}`, palette.muted)}`,
    ...sorted.map((route) => {
      const method = painter.paint(route.method.padEnd(7), palette.methods[route.method] ?? palette.fg)
      const path = painter.paint(route.path.padEnd(pathWidth), palette.fg)
      const access = padEndVisible(accessText(route.access, ctx), accessWidth)

      return `   ${method} ${path}  ${access}  ${painter.paint(route.controller, palette.muted)}`
    }),
  ]
}
