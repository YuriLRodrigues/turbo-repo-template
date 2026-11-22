'use client'

import { useEffect } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@workspace/api-client'
import { getPreferences, updatePreferences } from '@workspace/api-client/gen/endpoints/me'
import type { AppearanceChangesDto, PreferencesResponseDto } from '@workspace/api-client/models'
import { type Appearance, getAppearance, parseAppearance, setAppearance } from '@workspace/ui/appearance'

import { queryKeys } from '@/lib/query-keys'

const save = (change: Partial<Appearance>) => unwrap(updatePreferences({ appearance: change as AppearanceChangesDto }))

/** Only the choices of the look, without what the store adds (`resolvedTheme`). */
const choicesOf = ({ theme, accent, density, reduceMotion }: Appearance): Appearance => ({
  theme,
  accent,
  density,
  reduceMotion,
})

/**
 * The look follows the person, not the device (rule 1.7 of the API). Mount it once, in the signed-in shell.
 *
 * - An account that never changed its preferences (`updatedAt: null`, a new one) adopts the look of this device: what
 *   the person chose before signing up is kept and saved in the account.
 * - Otherwise the account wins: its look is applied, and kept on this device for the next first paint.
 */
export const usePreferencesSync = (): void => {
  const queryClient = useQueryClient()
  const preferences = useQuery({ queryKey: queryKeys.preferences, queryFn: () => unwrap(getPreferences()) })
  const data = preferences.data

  useEffect(() => {
    if (!data) return
    if (data.updatedAt === null) {
      void save(choicesOf(getAppearance()))
        .then((saved) => queryClient.setQueryData<PreferencesResponseDto>(queryKeys.preferences, saved))
        .catch(() => undefined)

      return
    }
    setAppearance(parseAppearance(data.appearance))
  }, [data, queryClient])
}

/**
 * Saves a change of the look in the account. The look itself was already applied and stored on the device by the
 * controls; a failure here only means another device will not see it, so it is not worth an error toast.
 */
export const useSaveAppearance = () => {
  const queryClient = useQueryClient()

  return (change: Partial<Appearance>) => {
    void save(change)
      .then((saved) => queryClient.setQueryData<PreferencesResponseDto>(queryKeys.preferences, saved))
      .catch(() => undefined)
  }
}
