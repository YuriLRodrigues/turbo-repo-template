import { z } from 'zod'

/** The rules of the API (rule 1.1), checked here first so most mistakes never leave the browser. */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72
export const NAME_MAX_LENGTH = 60

const email = z.string().trim().min(1, 'Enter your e-mail.').pipe(z.email('Enter a valid e-mail.'))
const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`)

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
})

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(NAME_MAX_LENGTH, `At most ${NAME_MAX_LENGTH} characters.`),
  email,
  password: newPassword,
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmation: z.string() })
  .refine((values) => values.password === values.confirmation, {
    path: ['confirmation'],
    message: 'The two passwords are not the same.',
  })
