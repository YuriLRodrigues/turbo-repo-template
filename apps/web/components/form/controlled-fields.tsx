'use client'

import { type ComponentProps, type ReactNode, useId } from 'react'

import { type Control, Controller, type FieldPath, type FieldValues } from 'react-hook-form'

import { Field, FieldDescription, FieldError } from '@workspace/ui/components/field'
import { Input, Label } from '@workspace/ui/components/input'
import { Switch } from '@workspace/ui/components/switch'
import { Textarea } from '@workspace/ui/components/textarea'

type ControlledProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues, unknown, FieldValues>
  name: FieldPath<TFieldValues>
  label: ReactNode
  description?: ReactNode
}

/**
 * An `Input` wired to react-hook-form: label, value, `aria-invalid` and the error message under the field.
 *
 *   <ControlledInput control={form.control} name="email" label="E-mail" type="email" autoComplete="email" />
 */
export const ControlledInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  id,
  ...props
}: ControlledProps<TFieldValues> &
  Omit<ComponentProps<typeof Input>, 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'>) => {
  const generated = useId()
  const fieldId = id ?? generated

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <Label htmlFor={fieldId}>{label}</Label>
          <Input
            {...props}
            {...field}
            id={fieldId}
            value={(field.value as string | undefined) ?? ''}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? `${fieldId}-error` : undefined}
          />
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError id={`${fieldId}-error`}>{fieldState.error?.message}</FieldError>
        </Field>
      )}
    />
  )
}

/** A `Textarea` wired to react-hook-form, the same way as `ControlledInput`. */
export const ControlledTextarea = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  id,
  ...props
}: ControlledProps<TFieldValues> &
  Omit<ComponentProps<typeof Textarea>, 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'>) => {
  const generated = useId()
  const fieldId = id ?? generated

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <Label htmlFor={fieldId}>{label}</Label>
          <Textarea
            {...props}
            {...field}
            id={fieldId}
            value={(field.value as string | null | undefined) ?? ''}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? `${fieldId}-error` : undefined}
          />
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError id={`${fieldId}-error`}>{fieldState.error?.message}</FieldError>
        </Field>
      )}
    />
  )
}

/** A `Switch` wired to react-hook-form, with its label and hint beside it. */
export const ControlledSwitch = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
}: ControlledProps<TFieldValues>) => {
  const fieldId = useId()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label htmlFor={fieldId} className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm leading-tight font-medium">{label}</span>
            {description && <span className="mt-1 block text-[0.8125rem] text-muted-foreground">{description}</span>}
          </span>
          <Switch
            id={fieldId}
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => field.onChange(checked)}
            onBlur={field.onBlur}
          />
        </label>
      )}
    />
  )
}
