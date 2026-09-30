import { createContext } from 'react'
import type { LanguagesResponse } from '../api'

export type LanguagesState =
  | { status: 'loading' }
  | { status: 'ready'; data: LanguagesResponse }
  | { status: 'error'; error: unknown }

export interface LanguagesContextValue {
  state: LanguagesState
  reload: () => void
}

export const LanguagesContext = createContext<LanguagesContextValue | null>(null)
