import { configureApiClient } from '@workspace/api-client'

import { API_URL } from './env'

let whenExpired: () => void = () => undefined

/**
 * The client is configured when this module is first imported, before anything renders: a request made from the
 * effect of any screen already goes to the API. What happens when the session ends is up to the session provider.
 */
configureApiClient({ baseUrl: API_URL, onSessionExpired: () => whenExpired() })

export const onSessionExpired = (handler: () => void): (() => void) => {
  whenExpired = handler

  return () => {
    whenExpired = () => undefined
  }
}
