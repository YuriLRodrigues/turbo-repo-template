import { z } from 'zod'

const TRUE = ['true', '1', 'on', 'yes']
const FALSE = ['false', '0', 'off', 'no']

/** `true|false`, `1|0`, `on|off`, `yes|no`. */
const flag = (fallback: boolean) =>
  z
    .string()
    .default(String(fallback))
    .transform((value, context) => {
      const normalized = value.trim().toLowerCase()
      if (TRUE.includes(normalized)) return true
      if (FALSE.includes(normalized)) return false
      context.addIssue({ code: 'custom', message: 'must be true or false' })

      return z.NEVER
    })

/** `https://app.example.com, http://localhost:3501` -> the list, without trailing slashes. */
const originList = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean),
    )
    .pipe(z.array(z.url('each origin must be a URL such as https://app.example.com')).min(1))

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    /** The name of the product, said in the e-mails and drawn in the boot banner. */
    APP_NAME: z.string().min(1).max(60).default('App'),
    PORT: z.coerce.number().int().positive().default(3500),

    /** Absent in development: the API runs on an embedded PGlite (docs/patterns/api/embedded-database.md). */
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }).optional(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    /** Where the embedded database keeps its files. `memory://` keeps nothing. Default: `apps/api/.pglite/data`. */
    PGLITE_DATA_DIR: z.string().min(1).optional(),
    /** The local port the embedded database listens on. `0` picks a free one. */
    PGLITE_PORT: z.coerce.number().int().min(0).max(65_535).default(0),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must have at least 32 characters'),
    /** Rule 1.3: the access token is short, 15 minutes. */
    JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(900),

    /** `SameSite` of the refresh cookie. `none` (web and API on different sites) also forces `Secure`. */
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    /** Who may call the API from a browser, with credentials. Comma separated. */
    CORS_ORIGINS: originList('http://localhost:3501'),
    /** How many reverse proxies sit in front of the API (so the client IP is read from `X-Forwarded-For`). */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
    /** Requests per window, per IP and per route, on the routes that need no token. */
    PUBLIC_RATE_LIMIT: z.coerce.number().int().positive().default(30),
    PUBLIC_RATE_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),

    /** The address of the web app: e-mail links point to it. */
    WEB_APP_URL: z.url().default('http://localhost:3501'),
    MAIL_FROM: z.string().min(3).default('App <no-reply@example.com>'),
    /** With a host, e-mails go out by SMTP; without one they are written to the log (rule 1.2). */
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    /** `true` for implicit TLS (port 465); `false` upgrades with STARTTLS when the server offers it. */
    SMTP_SECURE: flag(false),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
  })
  .superRefine((env, context) => {
    if (!env.DATABASE_URL && env.NODE_ENV !== 'development') {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL is required outside development (the embedded database is a development tool)',
      })
    }

    if (!env.SMTP_HOST && env.NODE_ENV === 'production') {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_HOST'],
        message: 'SMTP_HOST is required in production: e-mail confirmation and password reset must really be sent',
      })
    }

    if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
      context.addIssue({
        code: 'custom',
        path: [env.SMTP_USER ? 'SMTP_PASSWORD' : 'SMTP_USER'],
        message: 'SMTP_USER and SMTP_PASSWORD go together',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

/** A variable left empty in `.env` (`SMTP_HOST=`) is the same as a variable that is not there. */
function withoutBlanks(source: Record<string, string | undefined>): Record<string, string> {
  const filled: Record<string, string> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value.trim() !== '') filled[key] = value
  }

  return filled
}

/** Fails the boot with every invalid variable listed, instead of failing later on first use. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(withoutBlanks(source))

  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)
  }

  return result.data
}
