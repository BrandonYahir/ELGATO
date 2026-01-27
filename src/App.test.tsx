import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders initial status', () => {
    render(<App />)
    expect(screen.getByText('Tu turno (X)')).toBeInTheDocument()
  })

  it('places X and then O after a player move', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        board: ['X', null, null, null, 'O', null, null, null, null],
        move: 4,
        winner: null,
        draw: false,
      }),
    } as Response)

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
