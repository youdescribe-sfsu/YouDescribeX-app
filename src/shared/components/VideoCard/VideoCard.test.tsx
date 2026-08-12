import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'

jest.mock('../../../App', () => ({
  translate: (text: string) => text,
  userDataStore: {
    getState: () => ({
      isSignedIn: false,
      userId: '',
    }),
  },
}))

import VideoCard from './VideoCard'

describe('VideoCard preview link', () => {
  it('uses previewUrl for the thumbnail and title links', () => {
    const previewUrl = '/video/youtube123?ad=audio-description-123'

    render(
      <MemoryRouter>
        <VideoCard
          youTubeId="youtube123"
          audioDescriptionId="audio-description-123"
          title="Mock AI Draft Video"
          thumbnailMediumUrl="https://example.com/thumbnail.jpg"
          author="Mock Channel"
          duration="2:30"
          time=""
          buttons="none"
          previewUrl={previewUrl}
        />
      </MemoryRouter>,
    )

    const heading = screen.getByRole('heading', {
      name: 'Mock AI Draft Video',
    })

    expect(within(heading).getByRole('link')).toHaveAttribute(
      'href',
      previewUrl,
    )

    const thumbnail = screen.getByAltText('Mock AI Draft Video')

    expect(thumbnail.closest('a')).toHaveAttribute('href', previewUrl)
  })
})
