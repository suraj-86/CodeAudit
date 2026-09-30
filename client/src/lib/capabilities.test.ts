import { describe, expect, it } from 'vitest'
import { capabilitySentence, describeCapabilities } from './capabilities'
import type { LanguageInfo } from '../api'

const CPP: LanguageInfo = {
  id: 'cpp',
  label: 'C++',
  extensions: ['.cpp'],
  capabilities: { exactMatch: true, structural: true, batch: true, execution: false, ai: true },
}

const PYTHON: LanguageInfo = {
  id: 'python',
  label: 'Python',
  extensions: ['.py'],
  capabilities: { exactMatch: true, structural: false, batch: false, execution: true, ai: true },
}

describe('describeCapabilities', () => {
  it('splits keys into available and unavailable for the language', () => {
    const result = describeCapabilities(CPP, ['exactMatch', 'structural', 'execution'])
    expect(result.available).toEqual(['exactMatch', 'structural'])
    expect(result.unavailable).toEqual(['execution'])
  })
})

describe('capabilitySentence', () => {
  it('names what runs and what does not, keeping "AI" capitalised', () => {
    const sentence = capabilitySentence(PYTHON, ['exactMatch', 'structural', 'execution', 'ai'])
    expect(sentence).toContain('For Python:')
    expect(sentence).toContain('AI-assisted analysis')
    expect(sentence).not.toContain('ai-assisted analysis')
    expect(sentence).toContain('Not available yet')
  })

  it('has no "not available" clause when everything is available', () => {
    const allOn: LanguageInfo = { ...CPP, capabilities: { exactMatch: true, structural: true, batch: true, execution: true, ai: true } }
    expect(capabilitySentence(allOn, ['exactMatch', 'structural'])).not.toContain('Not available yet')
  })
})
