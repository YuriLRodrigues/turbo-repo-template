'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type FieldValues, useForm, type UseFormProps } from 'react-hook-form'
import type { z } from 'zod'

/**
 * The way to create a form (docs/patterns/web/forms.md): react-hook-form validated by the zod schema that lives next to
 * the form.
 *
 *   const form = useAppForm(noteFormSchema, { defaultValues: { title: '', body: '' } })
 *
 * It validates on submit and, after that, on every change (validating on blur moves the layout under the pointer
 * and can swallow the click on the submit button). Field values are typed from the schema input and `handleSubmit`
 * receives the schema output.
 */
export const useAppForm = <TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, TInput>,
  props: Omit<UseFormProps<TInput, unknown, TOutput>, 'resolver'> = {},
) =>
  useForm<TInput, unknown, TOutput>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    ...props,
    resolver: zodResolver(schema),
  })
