export type ButtonVariant = 'primary' | 'secondary' | 'quiet'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-semibold leading-tight select-none transition-[transform,box-shadow,background-color] duration-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none'

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-2 border-ink bg-violet text-white shadow-block not-disabled:hover:-translate-x-px not-disabled:hover:-translate-y-px not-disabled:hover:shadow-block-lg not-disabled:active:translate-x-0.5 not-disabled:active:translate-y-0.5 not-disabled:active:shadow-none',
  secondary:
    'border-2 border-ink bg-white text-ink shadow-block-sm not-disabled:hover:bg-marigold not-disabled:active:translate-x-px not-disabled:active:translate-y-px not-disabled:active:shadow-none',
  quiet:
    'rounded-full px-2 py-1 text-ink underline decoration-2 underline-offset-4 decoration-ink/30 not-disabled:hover:decoration-violet',
}

export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${base} ${variants[variant]} ${extra}`.trim()
}
