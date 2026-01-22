import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders initial status', () => {
    render(<App />)
    expect(screen.getByText('Bien es tu turno (X)')).toBeInTheDocument()
  })

  it('places X and then O after a player move', async () => {
    render(<App />)
    const user = userEvent.setup()
    const cells = screen.getAllByLabelText(/celda/i)

    await user.click(cells[0])
    expect(cells[0]).toHaveTextContent('X')

    await waitFor(() => {
      const updatedCells = screen.getAllByLabelText(/celda/i)
      const oCount = updatedCells.filter((cell) => cell.textContent === 'O').length
      expect(oCount).toBe(1)
    })
  })
})
