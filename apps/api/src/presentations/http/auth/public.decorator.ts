import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'auth:isPublic'

/** Every route requires a bearer token unless it is marked `@Public()`. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
