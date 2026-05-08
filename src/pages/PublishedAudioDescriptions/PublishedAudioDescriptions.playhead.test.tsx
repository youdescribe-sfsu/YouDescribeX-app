import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import PublishedAudioDescriptions from './PublishedAudioDescriptions'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockNavigate = jest.fn()
let mockTimelineTrackWidth = 100
let mockTimelineStopX = 0.1
let mockPlayerCurrentTime = 0
let mockYouTubePlayer:
  | {
      getCurrentTime: jest.Mock<number, []>
      setVolume: jest.Mock<void, [number]>
      pauseVideo: jest.Mock<void, []>
      playVideo: jest.Mock<void, []>
      seekTo: jest.Mock<void, [number, boolean | undefined]>
      getPlayerState: jest.Mock<number, []>
    }
  | undefined
const originalClientWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'clientWidth',
)

const mockCreateYouTubePlayer = () => ({
  getCurrentTime: jest.fn(() => mockPlayerCurrentTime),
  setVolume: jest.fn(),
  pauseVideo: jest.fn(),
  playVideo: jest.fn(),
  seekTo: jest.fn(),
  getPlayerState: jest.fn(() => 1),
})

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({
    audioDescriptionId: 'ad-1',
    youtubeVideoId: 'youtube-1',
  }),
  useLocation: () => ({
    pathname: '/audio-description/preview/youtube-1/ad-1',
  }),
}))

jest.mock(
  '@/App',
  () => {
    const mockState = { userId: 'user-1', isSignedIn: true }
    const userDataStore: any = jest.fn(
      (selector: (s: typeof mockState) => unknown) => selector(mockState),
    )
    userDataStore.getState = () => mockState
    return { userDataStore }
  },
  { virtual: true },
)

jest.mock('use-elapsed-time', () => ({
  useElapsedTime: () => ({
    elapsedTime: 0,
  }),
}))

jest.mock('../../shared/hooks/useCanonicalVideoDuration', () => ({
  __esModule: true,
  default: () => ({
    durationSeconds: 120,
    source: 'youtube',
    status: 'resolved',
  }),
}))

jest.mock('debounce', () => ({
  debounce: (fn: (...args: any[]) => unknown) => fn,
}))

jest.mock('react-youtube', () => ({
  __esModule: true,
  default: ({ onPlay }: { onPlay?: (event: { target: unknown }) => void }) => {
    if (!mockYouTubePlayer) {
      mockYouTubePlayer = mockCreateYouTubePlayer()
    }

    return (
      <div data-testid="youtube-player">
        <button
          type="button"
          data-testid="youtube-play"
          onClick={() => onPlay?.({ target: mockYouTubePlayer })}
        >
          Play
        </button>
      </div>
    )
  },
}))

jest.mock('react-draggable', () => ({
  __esModule: true,
  default: ({
    children,
    onDrag,
    onStart,
    onStop,
    position,
  }: {
    children: React.ReactNode
    onDrag?: (event: unknown, data: { x: number; y: number }) => void
    onStart?: (event: unknown, data: { x: number; y: number }) => void
    onStop?: (event: unknown, data: { x: number; y: number }) => void
    position?: { x: number; y: number }
  }) => (
    <div
      data-testid={onStop ? 'master-timeline-draggable' : undefined}
      data-x={position?.x ?? ''}
    >
      {onStart ? (
        <button
          type="button"
          data-testid="master-timeline-start"
          onClick={() => onStart({}, { x: mockTimelineStopX, y: 0 })}
        >
          Trigger drag start
        </button>
      ) : null}
      {onDrag ? (
        <button
          type="button"
          data-testid="master-timeline-drag"
          onClick={() => onDrag({}, { x: mockTimelineStopX, y: 0 })}
        >
          Trigger drag
        </button>
      ) : null}
      {onStop ? (
        <button
          type="button"
          data-testid="master-timeline-stop"
          onClick={() => onStop({}, { x: mockTimelineStopX, y: 0 })}
        >
          Trigger drag stop
        </button>
      ) : null}
      {children}
    </div>
  ),
}))

jest.mock('../../features/Describe/Buttons/Buttons', () => ({
  Buttons: ({ handlePlayPause }: { handlePlayPause: () => void }) => (
    <button
      type="button"
      data-testid="editor-play-pause"
      onClick={() => handlePlayPause()}
    >
      Play Pause
    </button>
  ),
}))

jest.mock('../../features/Describe/Notes/Notes', () => ({
  __esModule: true,
  default: () => <div data-testid="notes" />,
}))

jest.mock('../../features/Describe/InsertPublish/InsertPublish', () => ({
  __esModule: true,
  default: () => <div data-testid="insert-publish" />,
}))

jest.mock('../../features/Describe/AudioClip/AudioClip', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../../shared/components/Spinner/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}))

jest.mock(
  '@/shared/components/Modal/Modal',
  () => ({
    __esModule: true,
    default: () => <div data-testid="publish-modal" />,
  }),
  { virtual: true },
)

jest.mock('react-bootstrap/Button', () => ({
  __esModule: true,
  default: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}))

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}))

jest.mock('howler', () => {
  class MockHowl {
    load = jest.fn()
    unload = jest.fn()
    pause = jest.fn()
    seek = jest.fn()
    play = jest.fn()
    once = jest.fn()
    on = jest.fn()
    volume = jest.fn()
    state = jest.fn(() => 'loaded')
    playing = jest.fn(() => false)
  }

  return {
    Howl: MockHowl,
  }
})

const makeAudioDescriptionResponse = (clips: any[]) => ({
  Audio_Clips: clips,
  Notes: ['Notes'],
  is_published: false,
})

describe('PublishedAudioDescriptions master timeline clamping', () => {
  beforeEach(() => {
    mockTimelineTrackWidth = 100
    mockTimelineStopX = 0.1
    mockPlayerCurrentTime = 0
    mockYouTubePlayer = undefined
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockNavigate.mockReset()
    localStorage.clear()
    sessionStorage.clear()
    jest.useRealTimers()

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/videos/get-by-youtubeVideo/')) {
        return Promise.resolve({
          data: {
            video_id: 'video-1',
            video_length: 120,
          },
        })
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-1')) {
        return Promise.resolve({
          data: {
            items: [
              {
                id: 'youtube-1',
                contentDetails: {
                  duration: 'PT2M',
                },
              },
            ],
          },
        })
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/')) {
        return Promise.resolve({
          data: [],
        })
      }

      if (url.includes('/api/audio-descriptions/get-audio-description/ad-1')) {
        return Promise.resolve({
          data: makeAudioDescriptionResponse([]),
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        const element = this as HTMLElement

        if (
          element.classList.contains('timeline-track-wrapper') ||
          element.id === 'draggable-div'
        ) {
          return mockTimelineTrackWidth
        }

        if (element.classList.contains('progress-bar-div')) {
          return 2
        }

        return 1
      },
    })
  })

  afterAll(() => {
    if (originalClientWidth) {
      Object.defineProperty(
        HTMLElement.prototype,
        'clientWidth',
        originalClientWidth,
      )
    }
  })

  it('clamps a right-edge drag stop to the canonical duration', async () => {
    mockTimelineStopX = 120

    render(<PublishedAudioDescriptions />)

    await screen.findByTestId('master-timeline-stop')

    fireEvent.click(screen.getByTestId('master-timeline-stop'))

    await waitFor(() => {
      expect(screen.getByText('00:02:00:00')).toBeInTheDocument()
    })

    expect(
      Number(
        screen.getByTestId('master-timeline-draggable').getAttribute('data-x'),
      ),
    ).toBeCloseTo(98, 5)
  })

  it('clamps playback-driven time updates to the canonical duration and max playhead position', async () => {
    jest.useFakeTimers()
    mockPlayerCurrentTime = 130

    render(<PublishedAudioDescriptions />)

    await screen.findByTestId('youtube-play')

    fireEvent.click(screen.getByTestId('youtube-play'))

    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(screen.getByText('00:02:00:00')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(
        Number(
          screen
            .getByTestId('master-timeline-draggable')
            .getAttribute('data-x'),
        ),
      ).toBeCloseTo(98, 5)
    })
  })

  it('reprojects the playhead inside the timeline when the track width shrinks', async () => {
    jest.useFakeTimers()
    mockPlayerCurrentTime = 120

    render(<PublishedAudioDescriptions />)

    await screen.findByTestId('youtube-play')

    fireEvent.click(screen.getByTestId('youtube-play'))

    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(
        Number(
          screen
            .getByTestId('master-timeline-draggable')
            .getAttribute('data-x'),
        ),
      ).toBeCloseTo(98, 5)
    })

    mockTimelineTrackWidth = 50
    fireEvent(window, new Event('resize'))

    await waitFor(() => {
      expect(
        Number(
          screen
            .getByTestId('master-timeline-draggable')
            .getAttribute('data-x'),
        ),
      ).toBeCloseTo(48, 5)
    })

    expect(screen.getByText('00:02:00:00')).toBeInTheDocument()
  })

  it('pauses on playhead grab and restores iframe play button after drag ends', async () => {
    mockTimelineStopX = 30

    render(<PublishedAudioDescriptions />)

    await screen.findByTestId('youtube-play')
    fireEvent(window, new Event('resize'))
    await screen.findByTestId('master-timeline-stop', undefined, {
      timeout: 3000,
    })

    fireEvent.click(screen.getByTestId('youtube-play'))
    fireEvent.click(screen.getByTestId('master-timeline-start'))

    expect(mockYouTubePlayer?.pauseVideo).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('master-timeline-drag'))

    expect(mockYouTubePlayer?.seekTo).not.toHaveBeenCalled()
    expect(
      Number(
        screen.getByTestId('master-timeline-draggable').getAttribute('data-x'),
      ),
    ).toBeCloseTo(30, 5)

    fireEvent.click(screen.getByTestId('master-timeline-stop'))

    await waitFor(() => {
      expect(mockYouTubePlayer?.seekTo).toHaveBeenCalledTimes(1)
    })

    // After drag ends suppressResumeAfterScrubRef is cleared, so the iframe
    // play button is no longer blocked — pauseVideo count stays at 1.
    fireEvent.click(screen.getByTestId('youtube-play'))

    expect(mockYouTubePlayer?.pauseVideo).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('editor-play-pause'))
    fireEvent.click(screen.getByTestId('youtube-play'))

    expect(mockYouTubePlayer?.pauseVideo).toHaveBeenCalledTimes(1)
  })

  it('renders the editor playhead with the expanded hit area class', async () => {
    const { container } = render(<PublishedAudioDescriptions />)

    await screen.findByTestId('youtube-play')
    fireEvent(window, new Event('resize'))
    await screen.findByTestId('master-timeline-stop', undefined, {
      timeout: 3000,
    })

    expect(container.querySelector('.editor-progress-bar-div')).toBeTruthy()
  })
})
