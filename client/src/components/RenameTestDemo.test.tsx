import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RenameTestDemo } from './RenameTestDemo'

describe('RenameTestDemo', () => {
  it('starts with an identical structure', () => {
    render(<RenameTestDemo />)
    expect(screen.getByText(/Same structure/)).toBeInTheDocument()
  })

  it('stays identical when toggling only cosmetic changes', async () => {
    const user = userEvent.setup()
    render(<RenameTestDemo />)
    await user.click(screen.getByText('Rename every identifier'))
    await user.click(screen.getByText('Add comments'))
    await user.click(screen.getByText('Change a number'))
    expect(screen.getByText(/Same structure/)).toBeInTheDocument()
    expect(screen.getByText('mean')).toBeInTheDocument()
  })

  it('flags exactly one difference when the operator changes', async () => {
    const user = userEvent.setup()
    render(<RenameTestDemo />)
    await user.click(screen.getByText('Change an operator'))
    expect(screen.getByText(/1 tile differ/)).toBeInTheDocument()
  })
})
