import type { CapabilityKey, LanguageInfo } from '../api'

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  exactMatch: 'Exact match',
  structural: 'Structure comparison',
  execution: 'Correctness tests',
  ai: 'AI-assisted analysis',
  batch: 'Batch comparison',
}

export const CAPABILITY_HELP: Record<CapabilityKey, string> = {
  exactMatch: 'Are the two files identical, byte for byte?',
  structural: 'Do the programs have the same skeleton once names and values are ignored?',
  execution: 'Does the program produce the expected output for your test cases?',
  ai: 'A rough indicator of AI-style patterns. Never proof of who wrote the code.',
  batch: 'Compare many submissions against each other and a reference.',
}

export function describeCapabilities(
  language: LanguageInfo,
  keys: CapabilityKey[],
): { available: CapabilityKey[]; unavailable: CapabilityKey[] } {
  return {
    available: keys.filter((key) => language.capabilities[key]),
    unavailable: keys.filter((key) => !language.capabilities[key]),
  }
}

const lowercaseLabel = (label: string): string =>
  label === 'AI-assisted analysis' ? 'AI-assisted analysis' : label.toLowerCase()

function list(keys: CapabilityKey[]): string {
  return keys.map((key) => lowercaseLabel(CAPABILITY_LABELS[key])).join(', ')
}

export function capabilitySentence(language: LanguageInfo, keys: CapabilityKey[]): string {
  const { available, unavailable } = describeCapabilities(language, keys)
  const runs = available.length ? `For ${language.label}: ${list(available)}.` : `For ${language.label}: nothing here is available yet.`
  return unavailable.length ? `${runs} Not available yet: ${list(unavailable)}.` : runs
}
