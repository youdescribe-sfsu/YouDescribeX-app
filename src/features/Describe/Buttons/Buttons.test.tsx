import { render, screen } from '@testing-library/react'
import React from 'react'

jest.mock('@/assets/css/insertPublish.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/audioDesc.css', () => ({}), { virtual: true })
jest.mock(
  '@/shared/components/VideoPlayerControls/VideoPlayerControls',
  () => ({
    __esModule: true,
    default: () => <div>Mock Video Player Controls</div>,
  }),
  { virtual: true },
)

import { Buttons } from './Buttons'

describe('Buttons tutorial hooks', () => {
  it('renders optional tutorial data attributes for the play/pause control and audio ducking controls', () => {
    const { container } = render(
      <Buttons
        setHandleClicksFromParent={() => undefined}
        handlePlayPause={() => undefined}
        isGloballyPaused={false}
        descriptionVolume={80}
        setDescriptionVolume={() => undefined}
        youTubeVolume={30}
        setYouTubeVolume={() => undefined}
        playPauseDataTutorial="play-pause-btn"
        audioDuckingDataTutorial="audio-ducking"
      />,
    )

    expect(screen.getByRole('button', { name: /play \/ pause/i })).toHaveAttribute(
      'data-tutorial',
      'play-pause-btn',
    )
    expect(
      container.querySelector('[data-tutorial="audio-ducking"]'),
    ).toBeInTheDocument()
  })
})
