import type { Env } from './env'

/** Typed access to the validated environment. Inject it instead of reading `process.env`. */
export class EnvService {
  constructor(private readonly env: Env) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.env[key]
  }
}
