/*
 * The client of the API. The generated functions live in `@workspace/api-client/gen/endpoints/<tag>` and the types in
 * `@workspace/api-client/models`; this entry has the transport and the session around them.
 */
export {
  API_UNREACHABLE,
  ApiError,
  type ApiErrorBody,
  isApiError,
  isApiErrorBody,
  toApiError,
  toApiErrorBody,
} from './http/api-error'
export { customFetch, type CustomFetchResponse } from './http/custom-fetch'
export {
  type ApiClientConfig,
  clearSession,
  configureApiClient,
  expireSession,
  getAccessToken,
  hasSession,
  refreshAccessToken,
  REFRESH_LOCK,
  restoreSession,
  type SessionTokens,
  setSession,
  subscribeSession,
} from './http/session'
export { type SuccessOf, unwrap } from './http/unwrap'
