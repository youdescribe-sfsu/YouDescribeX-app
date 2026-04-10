import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import YDXHome from './YDXHome'

jest.mock('axios')

const mockNavigate = jest.fn()
const mockedAxios = axios as jest.Mocked<typeof axios>
const audioDescriptionResponses: any[] = []
let mockTimelineTrackWidth = 100
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
}))

jest.mock(
  '@/App',
  () => ({
    userDataStore: {
      getState: () => ({
        userId: 'user-1',
      }),
    },
  }),
  { virtual: true },
)

jest.mock('use-elapsed-time', () => ({
  useElapsedTime: () => ({
    elapsedTime: 0,
  }),
}))

jest.mock('debounce', () => ({
  debounce: (fn: (...args: any[]) => unknown) => fn,
}))

jest.mock('react-youtube', () => ({
  __esModule: true,
  default: ({ onPlay }: { onPlay?: (event: { target: unknown }) => void }) => {
    mockYouTubePlayer = mockCreateYouTubePlayer()

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
    onStop,
    position,
  }: {
    children: React.ReactNode
    onStop?: (event: unknown, data: { x: number; y: number }) => void
    position?: { x: number; y: number }
  }) => (
    <div
      data-testid={onStop ? 'master-timeline-draggable' : undefined}
      data-x={position?.x ?? ''}
    >
      {children}
    </div>
  ),
}))

jest.mock('../features/Describe/Buttons/Buttons', () => ({
  Buttons: () => <div data-testid="buttons" />,
}))

jest.mock('../features/Describe/Notes/Notes', () => ({
  __esModule: true,
  default: () => <div data-testid="notes" />,
}))

jest.mock('../features/Describe/InsertPublish/InsertPublish', () => ({
  __esModule: true,
  default: () => <div data-testid="insert-publish" />,
}))

jest.mock('../shared/components/Spinner/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}))

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

jest.mock('../features/Describe/AudioClip/AudioClip', () => ({
  __esModule: true,
  default: ({
    clip,
    editComponentToggleList,
    setNeedRefresh,
    setUndoDeletedClip,
  }: any) => {
    const hasToggle = editComponentToggleList.some(
      (item: { clipId: string }) => item.clipId === clip.clip_id,
    )

    return (
      <div
        data-testid={`clip-${clip.clip_id}`}
        data-has-toggle={String(hasToggle)}
      >
        <span>{clip.clip_id}</span>
        <button
          type="button"
          data-testid={`trigger-refresh-${clip.clip_id}`}
          onClick={() => setNeedRefresh(true)}
        >
          Trigger Refresh
        </button>
        <button
          type="button"
          data-testid={`trigger-delete-refresh-${clip.clip_id}`}
          onClick={() => {
            setUndoDeletedClip(true)
            setNeedRefresh(true)
          }}
        >
          Trigger Delete Refresh
        </button>
      </div>
    )
  },
}))

const makeClip = (overrides: Partial<Record<string, any>> = {}) => ({
  AudioDescriptionAdId: 'ad-1',
  clip_audio_path: '/audio/test-clip.mp3',
  clip_duration: 2,
  clip_end_time: 12,
  clip_id: 'clip-1',
  clip_sequence_number: 1,
  clip_start_time: 10,
  clip_title: 'Clip title',
  createdAt: '2026-03-01T00:00:00.000Z',
  description_text: 'Description',
  description_type: 'Visual',
  is_recorded: false,
  playback_type: 'inline',
  updatedAt: '2026-03-01T00:00:00.000Z',
  ...overrides,
})

const makeAudioDescriptionResponse = (clips: any[]) => ({
  Audio_Clips: clips,
  Notes: ['Notes'],
  is_collaborative_version: false,
  is_published: false,
})

const queueAudioDescriptionResponses = (...responses: any[]) => {
  audioDescriptionResponses.length = 0
  audioDescriptionResponses.push(...responses)
}

describe('YDXHome refresh alignment', () => {
  beforeEach(() => {
    audioDescriptionResponses.length = 0
    mockTimelineTrackWidth = 100
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

      if (url.includes('/api/audio-descriptions/get-user-ad/')) {
        const nextResponse =
          audioDescriptionResponses.length > 1
            ? audioDescriptionResponses.shift()
            : audioDescriptionResponses[0]

        if (!nextResponse) {
          throw new Error(`Missing audio description response for ${url}`)
        }

        return Promise.resolve({
          data: nextResponse,
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    mockedAxios.post.mockResolvedValue({
      data: {
        clip: {
          audio_description: 'ad-1',
          youtubeId: 'youtube-1',
        },
      },
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

  it('rebuilds edit toggles on a non-save refresh from a clip row', async () => {
    queueAudioDescriptionResponses(
      makeAudioDescriptionResponse([makeClip()]),
      makeAudioDescriptionResponse([
        makeClip(),
        makeClip({
          clip_id: 'clip-2',
          clip_start_time: 20,
          clip_end_time: 22,
        }),
      ]),
    )

    render(<YDXHome />)

    expect(await screen.findByTestId('clip-clip-1')).toHaveAttribute(
      'data-has-toggle',
      'true',
    )

    fireEvent.click(screen.getByTestId('trigger-refresh-clip-1'))

    await waitFor(() => {
      expect(screen.getByTestId('clip-clip-1')).toHaveAttribute(
        'data-has-toggle',
        'true',
      )
      expect(screen.getByTestId('clip-clip-2')).toHaveAttribute(
        'data-has-toggle',
        'true',
      )
    })
  })

  it('rebuilds edit toggles after undo restores clips through the non-save refresh path', async () => {
    queueAudioDescriptionResponses(
      makeAudioDescriptionResponse([makeClip()]),
      makeAudioDescriptionResponse([]),
      makeAudioDescriptionResponse([
        makeClip(),
        makeClip({
          clip_id: 'clip-restored',
          clip_start_time: 30,
          clip_end_time: 33,
        }),
      ]),
    )

    render(<YDXHome />)

    expect(await screen.findByTestId('clip-clip-1')).toHaveAttribute(
      'data-has-toggle',
      'true',
    )

    fireEvent.click(screen.getByTestId('trigger-delete-refresh-clip-1'))

    const undoButton = await screen.findByRole('button', {
      name: /undo last deleted/i,
    })

    fireEvent.click(undoButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/editor/youtube-1/ad-1')
      expect(screen.getByTestId('clip-clip-restored')).toHaveAttribute(
        'data-has-toggle',
        'true',
      )
    })
  })

  it('clamps playback-driven time updates to the canonical duration and max playhead position', async () => {
    jest.useFakeTimers()
    mockPlayerCurrentTime = 130
    queueAudioDescriptionResponses(makeAudioDescriptionResponse([]))

    render(<YDXHome />)

    await screen.findByTestId('insert-publish')

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
    queueAudioDescriptionResponses(makeAudioDescriptionResponse([]))

    render(<YDXHome />)

    await screen.findByTestId('insert-publish')

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
})
