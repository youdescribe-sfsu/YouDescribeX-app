import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import YDXHome from './YDXHome'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockNavigate = jest.fn()
const audioDescriptionResponses: any[] = []
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
  default: () => <div data-testid="youtube-player" />,
}))

jest.mock('react-draggable', () => ({
  __esModule: true,
  default: ({
    children,
    onStop,
  }: {
    children: React.ReactNode
    onStop?: (event: unknown, data: { x: number; y: number }) => void
  }) => (
    <div>
      {onStop ? (
        <button
          type="button"
          data-testid="master-timeline-stop"
          onClick={() => onStop({}, { x: 0.1, y: 0 })}
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
      get: () => 1,
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

    fireEvent.click(screen.getByTestId('master-timeline-stop'))

    await waitFor(() => {
      expect(screen.getByText('00:00:12:50')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /insert inline/i }))

    expect(readStartTimeInputs()).toEqual([0, 0, 12, 50])
  })
})
