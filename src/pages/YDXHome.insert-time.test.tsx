import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import YDXHome from './YDXHome'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockNavigate = jest.fn()
const audioDescriptionResponses: any[] = []
let mockTimelineTrackWidth = 100
let mockTimelineStopX = 0.1
let mockTimelineDragX = 0.1
const originalClientWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'clientWidth',
)

jest.mock('@/assets/css/insertPublish.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/audioDesc.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/editAudioDesc.css', () => ({}), { virtual: true })

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

jest.mock('debounce', () => ({
  debounce: (fn: (...args: any[]) => unknown) => fn,
}))

jest.mock('react-youtube', () => ({
  __esModule: true,
  default: () => <div data-testid="youtube-player" />,
}))

jest.mock('react-draggable', () => ({
  __esModule: true,
  default: ({
    children,
    onDrag,
    onStop,
    position,
  }: {
    children: React.ReactNode
    onDrag?: (event: unknown, data: { x: number; y: number }) => void
    onStop?: (event: unknown, data: { x: number; y: number }) => void
    position?: { x: number; y: number }
  }) => (
    <div
      data-testid={onStop ? 'master-timeline-draggable' : undefined}
      data-x={position?.x ?? ''}
    >
      {onDrag ? (
        <button
          type="button"
          data-testid="master-timeline-drag"
          onClick={() => onDrag({}, { x: mockTimelineDragX, y: 0 })}
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

jest.mock('../features/Describe/Buttons/Buttons', () => ({
  Buttons: () => <div data-testid="buttons" />,
}))

jest.mock('../features/Describe/Notes/Notes', () => ({
  __esModule: true,
  default: () => <div data-testid="notes" />,
}))

jest.mock('../features/Describe/AudioClip/AudioClip', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../shared/components/Spinner/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}))

jest.mock('../shared/components/Modal/Modal', () => ({
  __esModule: true,
  default: () => <div data-testid="publish-modal" />,
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

jest.mock('bootstrap', () => ({
  Tooltip: jest.fn(),
}))

jest.mock('react-media-recorder', () => ({
  useReactMediaRecorder: () => ({
    status: 'idle',
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    mediaBlobUrl: null,
    clearBlobUrl: jest.fn(),
  }),
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
  is_collaborative_version: false,
  is_published: false,
})

const queueAudioDescriptionResponses = (...responses: any[]) => {
  audioDescriptionResponses.length = 0
  audioDescriptionResponses.push(...responses)
}

const readStartTimeInputs = () =>
  screen
    .getAllByRole('spinbutton')
    .map((input) => Number((input as HTMLInputElement).value))

describe('YDXHome PR2 insert-time behavior', () => {
  beforeEach(() => {
    audioDescriptionResponses.length = 0
    mockTimelineTrackWidth = 100
    mockTimelineStopX = 10.208333333333334
    mockTimelineDragX = 10.208333333333334
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockNavigate.mockReset()
    localStorage.clear()
    sessionStorage.clear()

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

    mockedAxios.post.mockResolvedValue({ data: 'saved' })

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

  it('syncs the drag-stop time before insert-open snapshots the master timeline value', async () => {
    queueAudioDescriptionResponses(makeAudioDescriptionResponse([]))

    render(<YDXHome />)

    await screen.findByRole('button', { name: /insert inline/i })

    fireEvent.click(await screen.findByTestId('master-timeline-stop'))

    await waitFor(() => {
      expect(screen.getByText('00:00:12:50')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /insert inline/i }))

    expect(readStartTimeInputs()).toEqual([0, 0, 12, 50])
  })

  it('clamps a right-edge drag stop to the canonical duration before insert-open snapshots it', async () => {
    mockTimelineStopX = 120
    queueAudioDescriptionResponses(makeAudioDescriptionResponse([]))

    render(<YDXHome />)

    await screen.findByRole('button', { name: /insert inline/i })

    fireEvent.click(await screen.findByTestId('master-timeline-stop'))

    await waitFor(() => {
      expect(screen.getByText('00:02:00:00')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /insert inline/i }))

    expect(readStartTimeInputs()).toEqual([0, 2, 0, 0])
  })
})
