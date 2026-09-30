import { useContext } from 'react'
import { LanguagesContext } from './languages-context'

export function useLanguages() {
  const value = useContext(LanguagesContext)
  if (!value) throw new Error('useLanguages must be used inside <LanguagesProvider>.')
  return value
}
