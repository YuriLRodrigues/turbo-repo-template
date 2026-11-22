import { Module } from '@nestjs/common'

import { IdentityUserData } from '@domain/identity/applications/account-data/identity-user-data'
import {
  type UserDataContributor,
  UserDataContributors,
} from '@domain/identity/applications/account-data/user-data-contributor'
import { AccountLinkSender } from '@domain/identity/applications/services/account-link-sender'
import { SessionIssuer } from '@domain/identity/applications/services/session-issuer'
import { AuthenticateUserUseCase } from '@domain/identity/applications/use-cases/authenticate-user.use-case'
import { DeleteUserAccountUseCase } from '@domain/identity/applications/use-cases/delete-user-account.use-case'
import { ExportUserDataUseCase } from '@domain/identity/applications/use-cases/export-user-data.use-case'
import { GetPreferencesUseCase } from '@domain/identity/applications/use-cases/get-preferences.use-case'
import { GetUserProfileUseCase } from '@domain/identity/applications/use-cases/get-user-profile.use-case'
import { ListSessionsUseCase } from '@domain/identity/applications/use-cases/list-sessions.use-case'
import { ListUsersUseCase } from '@domain/identity/applications/use-cases/list-users.use-case'
import { RefreshSessionUseCase } from '@domain/identity/applications/use-cases/refresh-session.use-case'
import { RegisterUserUseCase } from '@domain/identity/applications/use-cases/register-user.use-case'
import { RequestPasswordResetUseCase } from '@domain/identity/applications/use-cases/request-password-reset.use-case'
import { ResendEmailVerificationUseCase } from '@domain/identity/applications/use-cases/resend-email-verification.use-case'
import { ResetPasswordUseCase } from '@domain/identity/applications/use-cases/reset-password.use-case'
import { RevokeSessionUseCase } from '@domain/identity/applications/use-cases/revoke-session.use-case'
import { SignOutUseCase } from '@domain/identity/applications/use-cases/sign-out.use-case'
import { UpdatePreferencesUseCase } from '@domain/identity/applications/use-cases/update-preferences.use-case'
import { VerifyEmailUseCase } from '@domain/identity/applications/use-cases/verify-email.use-case'
import { NotesUserData } from '@domain/notes/applications/account-data/notes-user-data'
import { CryptographyModule } from '@infra/cryptography/cryptography.module'
import { DatabaseModule } from '@infra/database/database.module'
import { MailModule } from '@infra/mail/mail.module'
import { TimeModule } from '@infra/time/time.module'

import { CookieOriginGuard } from '../../auth/cookie-origin.guard'
import { RefreshCookie } from '../../auth/refresh-transport'
import { DeleteUserAccountController } from './delete-user-account.controller'
import { ExportUserDataController } from './export-user-data.controller'
import { GetMeController } from './get-me.controller'
import { GetPreferencesController } from './get-preferences.controller'
import { ListSessionsController } from './list-sessions.controller'
import { ListUsersController } from './list-users.controller'
import { RefreshSessionController } from './refresh-session.controller'
import { RequestPasswordResetController } from './request-password-reset.controller'
import { ResendEmailVerificationController } from './resend-email-verification.controller'
import { ResetPasswordController } from './reset-password.controller'
import { RevokeSessionController } from './revoke-session.controller'
import { SessionResponder } from './session-responder'
import { SignInController } from './sign-in.controller'
import { SignOutController } from './sign-out.controller'
import { SignUpController } from './sign-up.controller'
import { UpdatePreferencesController } from './update-preferences.controller'
import { VerifyEmailController } from './verify-email.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule, MailModule, TimeModule],
  controllers: [
    SignUpController,
    SignInController,
    RefreshSessionController,
    SignOutController,
    VerifyEmailController,
    ResendEmailVerificationController,
    RequestPasswordResetController,
    ResetPasswordController,
    GetMeController,
    GetPreferencesController,
    UpdatePreferencesController,
    ListSessionsController,
    RevokeSessionController,
    ExportUserDataController,
    DeleteUserAccountController,
    ListUsersController,
  ],
  providers: [
    // HTTP helpers
    RefreshCookie,
    SessionResponder,
    CookieOriginGuard,
    // Domain helpers shared by use cases
    SessionIssuer,
    AccountLinkSender,
    // Rule 1.6: each bounded context contributes its part of "export my data" and "delete my account".
    // The order is the order of dependency: a context comes after the ones its data points to. A new context adds
    // its contributor here, in the two lists, and nothing else changes.
    IdentityUserData,
    NotesUserData,
    {
      provide: UserDataContributors,
      inject: [IdentityUserData, NotesUserData],
      useFactory: (...contributors: UserDataContributor[]) => new UserDataContributors(contributors),
    },
    // Use cases
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    RefreshSessionUseCase,
    SignOutUseCase,
    VerifyEmailUseCase,
    ResendEmailVerificationUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    GetUserProfileUseCase,
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
    ListSessionsUseCase,
    RevokeSessionUseCase,
    ExportUserDataUseCase,
    DeleteUserAccountUseCase,
    ListUsersUseCase,
  ],
})
export class IdentityHttpModule {}
