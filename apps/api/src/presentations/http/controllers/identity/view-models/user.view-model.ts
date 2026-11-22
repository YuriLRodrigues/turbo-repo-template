import type { Paginated } from '@core/pagination/pagination'
import type { User } from '@domain/identity/enterprise/entities/user.entity'

import type { UserResponseDto, UsersPageResponseDto } from '../dtos/user-response.dto'

/** The HTTP shape of a user. The password hash never leaves the server. */
export class UserViewModel {
  static toHttp(user: User): UserResponseDto {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email.value,
      role: user.role,
      emailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
    }
  }

  static toHttpPage({ results, meta }: Paginated<User>): UsersPageResponseDto {
    return { results: results.map((user) => UserViewModel.toHttp(user)), meta }
  }
}
