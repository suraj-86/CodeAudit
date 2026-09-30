/*
 * The landing-page "rename test". Structure sequences below are the real
 * output of the backend's own structural traversal (server/src/analysis/
 * structural/traversal.ts) for the snippet, so the demo shows what the
 * engine actually does. Renaming identifiers, adding comments and changing
 * a literal all leave the sequence untouched; changing an operator changes
 * exactly one node (index 18).
 */

export const BASE_STRUCTURE: readonly string[] = [
  'translation_unit',
  'function_definition',
  'primitive_type',
  'function_declarator',
  'identifier',
  'parameter_list',
  'parameter_declaration',
  'primitive_type',
  'identifier',
  'parameter_declaration',
  'primitive_type',
  'identifier',
  'compound_statement',
  'return_statement',
  'binary_expression',
  'parenthesized_expression',
  'binary_expression',
  'identifier',
  'OPERATOR:+',
  'identifier',
  'OPERATOR:/',
  'number_literal',
]

const OPERATOR_INDEX = 18

export interface SpecimenOptions {
  rename: boolean
  comments: boolean
  literal: boolean
  operator: boolean
}

export interface CodePart {
  text: string
  changed: boolean
}

const plain = (text: string): CodePart => ({ text, changed: false })

export function specimenParts(options: SpecimenOptions): CodePart[] {
  const mark = (text: string, on: boolean, original: string): CodePart =>
    on ? { text, changed: true } : plain(original)

  const parts: CodePart[] = []
  if (options.comments) parts.push({ text: '// averages two numbers\n', changed: true })
  parts.push(
    plain('int '),
    mark('mean', options.rename, 'average'),
    plain('(int '),
    mark('x', options.rename, 'a'),
    plain(', int '),
    mark('y', options.rename, 'b'),
    plain(') {\n    return ('),
    mark('x', options.rename, 'a'),
    plain(' '),
    mark('-', options.operator, '+'),
    plain(' '),
    mark('y', options.rename, 'b'),
    plain(') / '),
    mark('3', options.literal, '2'),
    plain(';'),
  )
  if (options.comments) parts.push({ text: ' // done', changed: true })
  parts.push(plain('\n}\n'))
  return parts
}

export const specimenText = (parts: CodePart[]): string => parts.map((p) => p.text).join('')

export const ORIGINAL_TEXT = specimenText(
  specimenParts({ rename: false, comments: false, literal: false, operator: false }),
)

export function specimenStructure(options: SpecimenOptions): string[] {
  const sequence = [...BASE_STRUCTURE]
  if (options.operator) sequence[OPERATOR_INDEX] = 'OPERATOR:-'
  return sequence
}

export function differingIndexes(a: readonly string[], b: readonly string[]): number[] {
  const out: number[] = []
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) out.push(i)
  return out
}
