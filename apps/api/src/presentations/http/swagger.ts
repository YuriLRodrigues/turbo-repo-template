import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger'

import { EnvService } from '@infra/env/env.service'

export const DOCS_PATH = '/docs'

const DESCRIPTION = [
  'The HTTP API of the app.',
  '',
  '- **Money** is always an integer number of cents (`amountCents`).',
  '- **Days** are dates without a time, `YYYY-MM-DD`. "Today" and the limits of a month follow the time zone of the ' +
    "person's preferences.",
  '- **Errors** have one shape, `{ statusCode, code, message, details? }`. `code` is stable (`NOTE.NOT_FOUND`): ' +
    'branch on it, never on the message.',
  '- **Lists** are paginated: `page` and `limit` in, `{ results, meta }` out.',
  "- **Ownership**: everything belongs to the signed-in person. Someone else's resource answers 404.",
  '- **Auth**: `Authorization: Bearer <accessToken>` (15 minutes). Renew it with `POST /auth/refresh`.',
].join('\n')

/**
 * One controller per endpoint, each with a `handle` method: the operation id is the controller's name
 * (`SignInController` -> `signIn`), so a generated client gets `signIn()`, `listNotes()`...
 */
const operationIdFactory = (controllerKey: string): string => {
  const name = controllerKey.replace(/Controller$/, '')

  return name.charAt(0).toLowerCase() + name.slice(1)
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(`${app.get(EnvService).get('APP_NAME')} API`)
    .setDescription(DESCRIPTION)
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Account, session and the links sent by e-mail (rules 1.1 to 1.5)')
    .addTag('me', 'The signed-in person: profile, preferences, sessions, export and deletion (rules 1.6 and 1.7)')
    .addTag('notes', 'The example bounded context: personal notes (rule 2)')
    .addTag('users', 'Administration')
    .addTag('health', 'Liveness')
    .build()

  return withUuidIds(SwaggerModule.createDocument(app, config, { operationIdFactory }))
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

/**
 * Every `:id` of a path is a uuid, checked by `ParseUUIDPipe` (a 400 otherwise). Swagger only sees "a text", so it
 * is said once here instead of with an `@ApiParam` on every controller.
 */
function withUuidIds(document: OpenAPIObject): OpenAPIObject {
  for (const path of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      for (const parameter of path[method]?.parameters ?? []) {
        if ('in' in parameter && parameter.in === 'path' && parameter.name === 'id') {
          parameter.schema = { type: 'string', format: 'uuid' }
        }
      }
    }
  }

  return document
}

/** Swagger UI at `/docs`, OpenAPI JSON at `/docs-json`. */
export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup(DOCS_PATH, app, () => createOpenApiDocument(app))
}
