import { type INestApplication, RequestMethod } from '@nestjs/common'
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants'
import { MetadataScanner, ModulesContainer, Reflector } from '@nestjs/core'

import type { Role } from '@core/auth/actor'
import type { RouteAccess, RouteInfo } from '@infra/logger/terminal/route-table'

import { IS_PUBLIC_KEY } from './auth/public.decorator'
import { ROLES_KEY } from './auth/roles.decorator'

type Handler = (...args: unknown[]) => unknown

const asList = (value: string | string[] | undefined): string[] =>
  value === undefined ? [''] : Array.isArray(value) ? value : [value]

function joinPath(prefix: string, path: string): string {
  const joined = [prefix, path]
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')

  return `/${joined}`
}

/**
 * Every route the app mapped, with who can call it, read from the same metadata the guards use (`@Public()`,
 * `@Roles()`). The boot prints it as a table, so a route that is public by mistake is visible on every start.
 */
export function collectRoutes(app: INestApplication): RouteInfo[] {
  const reflector = app.get(Reflector)
  const scanner = new MetadataScanner()
  const routes: RouteInfo[] = []

  for (const module of app.get(ModulesContainer).values()) {
    for (const { metatype, instance } of module.controllers.values()) {
      if (!metatype || !instance) continue

      const prototype = Object.getPrototypeOf(instance) as Record<string, Handler>
      const prefixes = asList(reflector.get<string | string[] | undefined>(PATH_METADATA, metatype))

      for (const name of scanner.getAllMethodNames(prototype)) {
        const handler = prototype[name]
        const method = reflector.get<RequestMethod | undefined>(METHOD_METADATA, handler)
        if (method === undefined) continue

        const targets = [handler, metatype]
        const roles = reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets)
        const access: RouteAccess = reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, targets)
          ? { kind: 'public' }
          : roles?.length
            ? { kind: 'roles', roles }
            : { kind: 'authenticated' }

        for (const prefix of prefixes) {
          for (const path of asList(reflector.get<string | string[] | undefined>(PATH_METADATA, handler))) {
            routes.push({
              method: RequestMethod[method],
              path: joinPath(prefix, path),
              controller: metatype.name.replace(/Controller$/, ''),
              access,
            })
          }
        }
      }
    }
  }

  return routes
}
