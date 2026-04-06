import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('@/assets/css/home.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/insertPublish.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/audioDesc.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/editAudioDesc.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/notes.css', () => ({}), { virtual: true })

jest.mock(
  '@/features/Describe/Buttons/Buttons',
  () => ({
    __esModule: true,
    Buttons: () => <div data-testid="mock-buttons" />,
  }),
  { virtual: true },
)

jest.mock(
  './MockThumbnail',
  () => ({
    __esModule: true,
    default: () => <div data-testid="mock-thumbnail" />,
  }),
  { virtual: true },
)

import MockEditorPage from './MockEditorPage'

describe('MockEditorPage tutorial target spacing', () => {
  beforeAll(() => {
    window.scrollTo = jest.fn()
  })

  it('keeps the publish spacing outside the collaborative editing spotlight target', () => {
    render(<MockEditorPage />)

    const target = screen
      .getByText(/enroll in collaborative editing/i)
      .closest('[data-tutorial="collab-checkbox"]')

    expect(target).toBeInTheDocument()
    expect(target?.parentElement).toHaveClass('me-3')
    expect(
      screen.getByText(/enroll in collaborative editing/i),
    ).not.toHaveClass('me-3')
  })
})
