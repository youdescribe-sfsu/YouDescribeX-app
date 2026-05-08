import React from 'react'
import { act, render, screen } from '@testing-library/react'
import axios from 'axios'
import YDXHome from './YDXHome'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockNavigate = jest.fn()
const routeParams = {
  audioDescriptionId: 'ad-1',
  youtubeVideoId: 'youtube-1',
}
const originalClientWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'clientWidth',
)

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => routeParams,
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
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
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

jest.mock('../features/Describe/AudioClip/AudioClip', () => ({
  __esModule: true,
  default: ({
    clip,
    videoLength,
  }: {
    clip: { clip_id: string }
    videoLength: number
  }) => (
    <div data-testid="audio-clip" data-video-length={videoLength}>
      {clip.clip_id}
    </div>
  ),
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

const makeAudioDescriptionResponse = () => ({
  Audio_Clips: [],
  Notes: ['Notes'],
  is_collaborative_version: false,
  is_published: false,
})

const makeClip = (id = 'clip-1') => ({
  AudioDescriptionAdId: 'ad-1',
  clip_audio_path: '/tmp/audio.mp3',
  clip_duration: 1,
  clip_end_time: 2,
  clip_id: id,
  clip_sequence_number: 1,
  clip_start_time: 1,
  clip_title: 'scene 1',
  is_recorded: false,
  playback_type: 'inline',
  description_text: 'clip text',
  description_type: 'action',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
})

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve,
    reject,
  }
}

describe('YDXHome canonical duration handling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockNavigate.mockReset()
    routeParams.audioDescriptionId = 'ad-1'
    routeParams.youtubeVideoId = 'youtube-1'
    localStorage.clear()
    sessionStorage.clear()

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 100,
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
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

  it('waits for YouTube metadata instead of surfacing stale backend duration while metadata is in flight', async () => {
    const youtubeResponse = createDeferred<{ data: { items: any[] } }>()

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/videos/get-by-youtubeVideo/')) {
        return Promise.resolve({
          data: {
            video_id: 'video-1',
            video_length: 42,
          },
        })
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-1')) {
        return youtubeResponse.promise
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/')) {
        return Promise.resolve({
          data: [],
        })
      }

      if (url.includes('/api/audio-descriptions/get-user-ad/')) {
        return Promise.resolve({
          data: makeAudioDescriptionResponse(),
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    render(<YDXHome />)

    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      jest.advanceTimersByTime(800)
      await Promise.resolve()
    })

    expect(screen.queryByText(/00:00:42:00/)).not.toBeInTheDocument()

    await act(async () => {
      youtubeResponse.resolve({
        data: {
          items: [
            {
              id: 'youtube-1',
              contentDetails: {
                duration: 'PT8S',
              },
            },
          ],
        },
      })
      await Promise.resolve()
    })

    expect(await screen.findByText(/00:00:08:00/)).toBeInTheDocument()
  })

  it('falls back to backend video length when YouTube metadata is unavailable', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/videos/get-by-youtubeVideo/')) {
        return Promise.resolve({
          data: {
            video_id: 'video-1',
            video_length: 42,
          },
        })
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-1')) {
        return Promise.reject(new Error('YouTube unavailable'))
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/')) {
        return Promise.resolve({
          data: [],
        })
      }

      if (url.includes('/api/audio-descriptions/get-user-ad/')) {
        return Promise.resolve({
          data: makeAudioDescriptionResponse(),
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    render(<YDXHome />)

    expect(await screen.findByText(/00:00:42:00/)).toBeInTheDocument()
  })

  it('resolves duration from the shared YouTube metadata path only once per editor open', async () => {
    const youtubeResponse = createDeferred<{ data: { items: any[] } }>()

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/videos/get-by-youtubeVideo/')) {
        return Promise.resolve({
          data: {
            video_id: 'video-1',
            video_length: 42,
          },
        })
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-1')) {
        return youtubeResponse.promise
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/')) {
        return Promise.resolve({
          data: [],
        })
      }

      if (url.includes('/api/audio-descriptions/get-user-ad/')) {
        return Promise.resolve({
          data: makeAudioDescriptionResponse(),
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    render(<YDXHome />)

    await act(async () => {
      jest.advanceTimersByTime(60)
      await Promise.resolve()
    })

    expect(
      mockedAxios.get.mock.calls.filter(([url]) =>
        String(url).includes('/api/youtube-proxy/videos?id=youtube-1'),
      ),
    ).toHaveLength(1)

    await act(async () => {
      youtubeResponse.resolve({
        data: {
          items: [
            {
              id: 'youtube-1',
              contentDetails: {
                duration: 'PT8S',
              },
            },
          ],
        },
      })
      await Promise.resolve()
    })

    expect(await screen.findByText(/00:00:08:00/)).toBeInTheDocument()
  })

  it('keeps the resolved YouTube duration when backend video length arrives later', async () => {
    const backendVideoResponse = createDeferred<{
      data: { video_id: string; video_length: number }
    }>()
    const youtubeResponse = createDeferred<{ data: { items: any[] } }>()

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/videos/get-by-youtubeVideo/')) {
        return backendVideoResponse.promise
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-1')) {
        return youtubeResponse.promise
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/')) {
        return Promise.resolve({
          data: [],
        })
      }

      if (url.includes('/api/audio-descriptions/get-user-ad/')) {
        return Promise.resolve({
          data: makeAudioDescriptionResponse(),
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    render(<YDXHome />)

    await act(async () => {
      jest.advanceTimersByTime(60)
      await Promise.resolve()
    })

    await act(async () => {
      youtubeResponse.resolve({
        data: {
          items: [
            {
              id: 'youtube-1',
              contentDetails: {
                duration: 'PT8S',
              },
            },
          ],
        },
      })
      await Promise.resolve()
    })

    expect(await screen.findByText(/00:00:08:00/)).toBeInTheDocument()

    await act(async () => {
      backendVideoResponse.resolve({
        data: {
          video_id: 'video-1',
          video_length: 42,
        },
      })
      await Promise.resolve()
    })

    expect(screen.getByText(/00:00:08:00/)).toBeInTheDocument()
    expect(
      mockedAxios.get.mock.calls.filter(([url]) =>
        String(url).includes('/api/youtube-proxy/videos?id=youtube-1'),
      ),
    ).toHaveLength(1)
  })

  it('falls back to backend video length without retrying YouTube when the initial metadata lookup already failed', async () => {
    const backendVideoResponse = createDeferred<{
      data: { video_id: string; video_length: number }
    }>()

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/videos/get-by-youtubeVideo/')) {
        return backendVideoResponse.promise
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-1')) {
        return Promise.reject(new Error('YouTube unavailable'))
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/')) {
        return Promise.resolve({
          data: [],
        })
      }

      if (url.includes('/api/audio-descriptions/get-user-ad/')) {
        return Promise.resolve({
          data: makeAudioDescriptionResponse(),
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    render(<YDXHome />)

    await act(async () => {
      jest.advanceTimersByTime(60)
      await Promise.resolve()
    })

    expect(
      mockedAxios.get.mock.calls.filter(([url]) =>
        String(url).includes('/api/youtube-proxy/videos?id=youtube-1'),
      ),
    ).toHaveLength(1)

    await act(async () => {
      backendVideoResponse.resolve({
        data: {
          video_id: 'video-1',
          video_length: 42,
        },
      })
      await Promise.resolve()
    })

    await act(async () => {
      jest.advanceTimersByTime(60)
      await Promise.resolve()
    })

    expect(await screen.findByText(/00:00:42:00/)).toBeInTheDocument()
    expect(
      mockedAxios.get.mock.calls.filter(([url]) =>
        String(url).includes('/api/youtube-proxy/videos?id=youtube-1'),
      ),
    ).toHaveLength(1)
  })

  it('hides clip rows while the next video is still resolving its canonical duration', async () => {
    const secondVideoResponse = createDeferred<{
      data: { video_id: string; video_length: number }
    }>()
    const secondYoutubeResponse = createDeferred<{ data: { items: any[] } }>()

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/videos/get-by-youtubeVideo/youtube-1')) {
        return Promise.resolve({
          data: {
            video_id: 'video-1',
            video_length: 42,
          },
        })
      }

      if (url.includes('/api/videos/get-by-youtubeVideo/youtube-2')) {
        return secondVideoResponse.promise
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-1')) {
        return Promise.resolve({
          data: {
            items: [
              {
                id: 'youtube-1',
                contentDetails: {
                  duration: 'PT8S',
                },
              },
            ],
          },
        })
      }

      if (url.includes('/api/youtube-proxy/videos?id=youtube-2')) {
        return secondYoutubeResponse.promise
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/video-1')) {
        return Promise.resolve({
          data: [],
        })
      }

      if (url.includes('/api/audio-descriptions/get-user-ad/video-1&ad-1')) {
        return Promise.resolve({
          data: {
            ...makeAudioDescriptionResponse(),
            Audio_Clips: [makeClip('clip-1')],
          },
        })
      }

      if (url.includes('/api/audio-descriptions/get-user-ad/video-2&ad-2')) {
        return Promise.resolve({
          data: {
            ...makeAudioDescriptionResponse(),
            Audio_Clips: [makeClip('clip-2')],
          },
        })
      }

      if (url.includes('/api/dialog-timestamps/get-video-dialog/video-2')) {
        return Promise.resolve({
          data: [],
        })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })

    const { rerender } = render(<YDXHome />)

    await act(async () => {
      jest.advanceTimersByTime(60)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(await screen.findByTestId('audio-clip')).toHaveAttribute(
      'data-video-length',
      '8',
    )

    routeParams.audioDescriptionId = 'ad-2'
    routeParams.youtubeVideoId = 'youtube-2'

    rerender(<YDXHome />)

    await act(async () => {
      jest.advanceTimersByTime(60)
      await Promise.resolve()
    })

    await act(async () => {
      secondVideoResponse.resolve({
        data: {
          video_id: 'video-2',
          video_length: 42,
        },
      })
      await Promise.resolve()
    })

    expect(screen.queryByTestId('audio-clip')).not.toBeInTheDocument()

    await act(async () => {
      secondYoutubeResponse.resolve({
        data: {
          items: [
            {
              id: 'youtube-2',
              contentDetails: {
                duration: 'PT10S',
              },
            },
          ],
        },
      })
      await Promise.resolve()
    })
  })
})
