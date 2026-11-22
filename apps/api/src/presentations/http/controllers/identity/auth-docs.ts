import { applyDecorators } from '@nestjs/common'
import { ApiHeader } from '@nestjs/swagger'

import {
  AUTH_TRANSPORT_HEADER,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_HEADER,
} from '../../auth/refresh-transport'

/** Swagger text shared by the routes that deal with the refresh token. */
export const REFRESH_COOKIE_HEADER = {
  'Set-Cookie': {
    description:
      `Default transport only: \`${REFRESH_COOKIE}=<refresh token>; HttpOnly; Path=${REFRESH_COOKIE_PATH}; ` +
      'SameSite=<configured>; Secure (in production); Expires=<30 days>`.',
    schema: { type: 'string' },
  },
} as const

/** `x-auth-transport: token` switches the refresh token from the cookie to the body. */
export const ApiAuthTransportHeader = () =>
  ApiHeader({
    name: AUTH_TRANSPORT_HEADER,
    required: false,
    enum: ['token'],
    description:
      'Send `token` from a native app: the refresh token then comes in the response body instead of the httpOnly ' +
      'cookie. Leave it out on the web.',
  })

/** The refresh token of a native app. On the web the browser sends the cookie by itself. */
export const ApiRefreshTokenHeaders = () =>
  applyDecorators(
    ApiAuthTransportHeader(),
    ApiHeader({
      name: REFRESH_TOKEN_HEADER,
      required: false,
      description: `With \`${AUTH_TRANSPORT_HEADER}: token\`: the refresh token. Otherwise it is read from the cookie.`,
    }),
  )
