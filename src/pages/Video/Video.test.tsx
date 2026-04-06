import React from 'react'
import { act, render, waitFor } from '@testing-library/react'
import axios from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Video from './Video'
import ourFetch from '@/shared/utils/ourFetch'
import YouTubeService from '@/shared/utils/YouTubeService'

jest.mock('axios')
jest.mock(
  '@/shared/utils/ourFetch',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
  { virtual: true },
)
jest.mock(
  '@/shared/utils/YouTubeService',
  () => ({
    __esModule: true,
    default: {
      getVideoDetails: jest.fn(),
    },
  }),
  { virtual: true },
)
jest.mock(
  '@/shared/config',
  () => ({
    __esModule: true,
    apiUrl: 'http://localhost:4001/api',
    audioClipsUploadsPath: (clipPath: string) =>
      `http://localhost:4001/api/static${clipPath}`,
    audioDescriptionFeedbacks: {},
  }),
  { virtual: true },
)
jest.mock(
  '@/shared/utils/convertClipObject',
  () => ({
    __esModule: true,
    convertClassicClipObject: (clip: any) => ({
      audioDescriptionAdId: clip.audio_description,
      clip_audio: clip.clip_audio,
      clip_audio_path: clip.url,
      clip_duration: clip.duration,
      clip_end_time: clip.end_time,
      clip_id: clip._id,
      clip_sequence_number: clip.clip_sequence_number ?? 0,
      clip_start_time: clip.start_time,
      createdAt: clip.created_at,
      description_text: clip.description_text,
      description_type: clip.description_type,
      is_recorded: clip.is_recorded,
      playback_type: clip.playback_type,
    }),
  }),
  { virtual: true },
)
jest.mock(
  '@/shared/utils/convertISO8601ToSeconds',
  () => ({
    __esModule: true,
    default: jest.fn(() => 10),
  }),
  { virtual: true },
)
jest.mock(
  '@/shared/utils/convertViewsToCardFormat',
  () => ({
    __esModule: true,
    default: jest.fn(() => '10'),
  }),
  { virtual: true },
)
jest.mock(
  '@/shared/utils/convertLikesToCardFormat',
  () => ({
    __esModule: true,
    convertLikesToCardFormat: jest.fn(() => '1'),
  }),
  { virtual: true },
)
jest.mock(
  '@/shared/utils/convertISO8601ToDate',
  () => ({
    __esModule: true,
    convertISO8601ToDate: jest.fn(() => 'Apr 1, 2026'),
  }),
  { virtual: true },
)

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedOurFetch = ourFetch as jest.MockedFunction<typeof ourFetch>
const mockedYouTubeService = YouTubeService as jest.Mocked<typeof YouTubeService>
const mockYouTubeProps: { current: any } = { current: null }
const mockHowlerState: { instances: any[] } = { instances: [] }

jest.mock(
  '@/App',
  () => ({
    translate: (value: string) => value,
    userDataStore: {
      getState: () => ({
        isSignedIn: false,
        userId: 'user-1',
        userToken: 'token-1',
      }),
    },
  }),
  { virtual: true },
)

jest.mock(
  '@/features/Video/ShareBar/ShareBar',
  () => ({
    __esModule: true,
    default: () => <div data-testid="share-bar" />,
  }),
  { virtual: true },
)

jest.mock(
  '@/shared/components/Button/Button',
  () => ({
    __esModule: true,
    default: ({
      text,
      onClick,
    }: {
      text?: string
      onClick?: React.MouseEventHandler<HTMLButtonElement>
    }) => (
      <button type="button" onClick={onClick}>
        {text || 'button'}
      </button>
    ),
  }),
  { virtual: true },
)

jest.mock(
  '@/shared/components/Spinner/Spinner',
  () => ({
    __esModule: true,
    default: () => <div data-testid="spinner" />,
  }),
  { virtual: true },
)

jest.mock(
  '@/shared/components/VideoPlayerControls/VideoPlayerControls',
  () => ({
    __esModule: true,
    default: () => <div data-testid="player-controls" />,
  }),
  { virtual: true },
)

jest.mock(
  '@/features/Video/YTInfoCard/YTInfoCard',
  () => ({
    __esModule: true,
    default: () => <div data-testid="yt-info-card" />,
  }),
  { virtual: true },
)

jest.mock(
  '@/features/Video/DescriberCard/DescriberCard',
  () => ({
    __esModule: true,
    default: () => <div data-testid="describer-card" />,
  }),
  { virtual: true },
)

jest.mock(
  '@/features/Video/RatingPopup/RatingPopup',
  () => ({
    __esModule: true,
    default: () => <div data-testid="rating-popup" />,
  }),
  { virtual: true },
)

jest.mock(
  '@/features/Video/FeedbackPopup/FeedbackPopup',
  () => ({
    __esModule: true,
    default: () => <div data-testid="feedback-popup" />,
  }),
  { virtual: true },
)

jest.mock(
  '@/features/Video/RatingsInfoCard/RatingsInfoCard',
  () => ({
    __esModule: true,
    default: () => <div data-testid="ratings-info-card" />,
  }),
  { virtual: true },
)

jest.mock('./LanguageSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="language-selector" />,
}))

jest.mock('react-bootstrap', () => ({
  ProgressBar: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="progress-bar">{children}</div>
  ),
}))

jest.mock('react-youtube', () => ({
  __esModule: true,
  default: (props: any) => {
    mockYouTubeProps.current = props
    return <div data-testid="youtube-player" />
  },
}))

type EventHandler = (...args: any[]) => void

jest.mock('howler', () => {
  class MockHowl {
    options: { src: string; html5: boolean; preload?: boolean }
    load = jest.fn()
    unload = jest.fn(() => {
      this.isPlaying = false
    })
    pause = jest.fn(() => {
      this.isPlaying = false
    })
    stop = jest.fn(() => {
      this.isPlaying = false
    })
    seek = jest.fn()
    volume = jest.fn()
    once = jest.fn((event: string, handler: EventHandler) => {
      const handlers = this.onceHandlers.get(event) || []
      handlers.push(handler)
      this.onceHandlers.set(event, handlers)
    })
    on = jest.fn((event: string, handler: EventHandler) => {
      const handlers = this.onHandlers.get(event) || []
      handlers.push(handler)
      this.onHandlers.set(event, handlers)
    })
    play = jest.fn(() => {
      this.isPlaying = true
      this.trigger('play')
      return 1
    })
    state = jest.fn(() => this.loadState)
    playing = jest.fn(() => this.isPlaying)
    duration = jest.fn(() => this.clipDuration)

    private onceHandlers = new Map<string, EventHandler[]>()
    private onHandlers = new Map<string, EventHandler[]>()
    private loadState = 'loaded'
    private isPlaying = false
    private clipDuration = 2

    constructor(options: { src: string; html5: boolean; preload?: boolean }) {
      this.options = options
      mockHowlerState.instances.push(this)
    }

    setState(nextState: string) {
      this.loadState = nextState
    }

    setDuration(nextDuration: number) {
      this.clipDuration = nextDuration
    }

    trigger(event: string, ...args: any[]) {
      if (event === 'end' || event === 'loaderror' || event === 'playerror') {
        this.isPlaying = false
      }

      const persistentHandlers = this.onHandlers.get(event) || []
      persistentHandlers.forEach((handler) => handler(...args))

      const oneTimeHandlers = this.onceHandlers.get(event) || []
      this.onceHandlers.delete(event)
      oneTimeHandlers.forEach((handler) => handler(...args))
    }
  }

  return {
    Howl: MockHowl,
  }
})

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
  },
}))

const makeClip = (overrides: Partial<Record<string, any>> = {}) => ({
  _id: 'clip-1',
  audio_description: 'ad-1',
  created_at: '2026-04-01T00:00:00.000Z',
  description_type: 'Visual',
  description_text: 'A description',
  duration: 2,
  end_time: 7,
  file_mime_type: 'audio/wav',
  file_name: 'clip-1.wav',
  file_path: '/current/video-1',
  file_size_bytes: 256,
  is_recorded: false,
  label: '',
  playback_type: 'extended',
  start_time: 5,
  transcript: [],
  updated_at: '2026-04-01T00:00:00.000Z',
  user: 'user-1',
  video: 'video-1',
  __v: 0,
  ...overrides,
})

const makeVideoData = (clips: any[]) => ({
  _id: 'video-record-1',
  audio_descriptions: [
    {
      _id: 'ad-1',
      admin_review: false,
      audio_clips: clips,
      collaborative_editing: false,
      contributions: new Map<string, number>(),
      created_at: '2026-04-01T00:00:00.000Z',
      depth: 0,
      displayContributions: {},
      feedbacks: {},
      language: 'en-US',
      legacy_notes: '',
      overall_rating_votes_average: 0,
      overall_rating_votes_counter: 0,
      overall_rating_votes_sum: 0,
      prev_audio_description: '',
      status: 'published',
      updated_at: '2026-04-01T00:00:00.000Z',
      user: {
        _id: 'user-1',
        email: 'user@example.com',
        google_user_id: 'google-1',
        last_login: '2026-04-01T00:00:00.000Z',
        name: 'Test User',
        picture: 'https://example.com/picture.png',
        token: 'token-1',
        updated_at: '2026-04-01T00:00:00.000Z',
        user_type: 'human',
        __v: 0,
      },
      video: 'video-record-1',
      views: 0,
      __v: 0,
    },
  ],
  category: 'Category',
  category_id: 1,
  created_at: '2026-04-01T00:00:00.000Z',
  custom_tags: [],
  description: 'Video description',
  duration: 10,
  tags: [],
  title: 'Video title',
  updated_at: '2026-04-01T00:00:00.000Z',
  views: 100,
  youtube_id: 'video-1',
  youtube_status: 'public',
  __v: 0,
})

const makePlayer = () => {
  let currentTime = 0
  const player = {
    get currentTime() {
      return currentTime
    },
    set currentTime(value: number) {
      currentTime = value
    },
    getCurrentTime: jest.fn(() => currentTime),
    pauseVideo: jest.fn(),
    playVideo: jest.fn(),
    setVolume: jest.fn(),
    getPlayerState: jest.fn(() => 1),
    seekTo: jest.fn(),
  }

  return player
}

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

const renderVideoPage = async (clips: any[]) => {
  mockedOurFetch.mockResolvedValue({
    code: 200,
    message: 'ok',
    result: makeVideoData(clips),
    status: 200,
    type: 'success',
  })

  mockedYouTubeService.getVideoDetails.mockResolvedValue([
    {
      id: 'video-1',
      contentDetails: {
        duration: 'PT10S',
      },
      snippet: {
        channelTitle: 'Channel',
        publishedAt: '2026-04-01T00:00:00.000Z',
        title: 'Video title',
      },
      statistics: {
        likeCount: '1',
        viewCount: '10',
      },
    },
  ] as any)

  render(
    <MemoryRouter initialEntries={['/video/video-1?ad=ad-1']}>
      <Routes>
        <Route path="/video/:videoId" element={<Video />} />
      </Routes>
    </MemoryRouter>,
  )

  await waitFor(() => {
    expect(mockedOurFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/videos/video-1'),
    )
  })

  await waitFor(() => {
    expect(mockedYouTubeService.getVideoDetails).toHaveBeenCalledWith('video-1')
  })

  await waitFor(() => {
    expect(mockHowlerState.instances.length).toBeGreaterThan(0)
  })

  return { firstHowl: mockHowlerState.instances[0] }
}

const startPlaybackAt = async (player: ReturnType<typeof makePlayer>, time: number) => {
  player.currentTime = time

  await act(async () => {
    mockYouTubeProps.current.onReady({ target: player })
  })

  await flushMicrotasks()

  await act(async () => {
    mockYouTubeProps.current.onStateChange({ data: 1, target: player })
  })

  await flushMicrotasks()

  await act(async () => {
    mockYouTubeProps.current.onPlay({ target: player })
  })

  await flushMicrotasks()

  await waitFor(() => {
    expect(player.setVolume).toHaveBeenCalled()
  })
}

const getLatestHowl = () =>
  mockHowlerState.instances[mockHowlerState.instances.length - 1]

const advancePollingCycle = async (ms = 250) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })

  await flushMicrotasks()
}

const advanceClipStartDelay = async (ms = 60) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })

  await flushMicrotasks()
}

describe('Video extended clip playback', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.useFakeTimers()
    mockHowlerState.instances.length = 0
    mockYouTubeProps.current = null
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockedOurFetch.mockReset()
    mockedYouTubeService.getVideoDetails.mockReset()
    localStorage.clear()
    sessionStorage.clear()

    mockedAxios.get.mockImplementation((url?: string) => {
      if (url?.includes('/api/users/ai-service-status')) {
        return Promise.resolve({ data: { available: false } })
      }

      if (url?.includes('/api/audio-clips/get-playback-type/clip-inline-1')) {
        return Promise.resolve({ data: { playback_type: 'inline' } })
      }

      if (url?.includes('/api/audio-clips/get-playback-type/')) {
        return Promise.resolve({ data: { playback_type: 'extended' } })
      }

      throw new Error(`Unexpected axios.get URL: ${url}`)
    })
    mockedAxios.post.mockResolvedValue({ data: {} })
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
    } as Response)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    global.fetch = originalFetch
  })

  it('resumes the video when a loaded extended clip ends', async () => {
    await renderVideoPage([makeClip()])
    const player = makePlayer()

    await startPlaybackAt(player, 5)
    const activeHowl = getLatestHowl()

    await advancePollingCycle()

    expect(player.pauseVideo).toHaveBeenCalled()

    await advanceClipStartDelay()

    expect(activeHowl.play).toHaveBeenCalled()

    act(() => {
      activeHowl.trigger('end')
    })

    expect(player.playVideo).toHaveBeenCalled()
  })

  it('does not treat the programmatic extended-clip pause as a seek', async () => {
    await renderVideoPage([
      makeClip({
        start_time: 1.22,
        end_time: 2.42,
        duration: 1.2,
      }),
    ])
    const player = makePlayer()
    player.pauseVideo.mockImplementation(() => {
      mockYouTubeProps.current.onStateChange({ data: 2, target: player })
    })

    await startPlaybackAt(player, 0)
    player.currentTime = 1.22
    const activeHowl = getLatestHowl()

    await advancePollingCycle()

    expect(player.pauseVideo).toHaveBeenCalled()
    expect(activeHowl.unload).not.toHaveBeenCalled()

    await advanceClipStartDelay()

    expect(activeHowl.play).toHaveBeenCalled()
  })

  it('does not discard an extended clip when playback crosses slightly past its start time', async () => {
    await renderVideoPage([makeClip()])
    const player = makePlayer()

    await startPlaybackAt(player, 5.1)
    const activeHowl = getLatestHowl()

    await advancePollingCycle()

    expect(player.pauseVideo).toHaveBeenCalled()

    await advanceClipStartDelay()

    expect(activeHowl.play).toHaveBeenCalled()

    act(() => {
      activeHowl.trigger('end')
    })

    expect(player.playVideo).toHaveBeenCalled()
  })

  it('waits for an extended clip to load before playing it', async () => {
    await renderVideoPage([makeClip()])
    const player = makePlayer()

    await startPlaybackAt(player, 5)
    const activeHowl = getLatestHowl()
    activeHowl.setState('loading')

    await advancePollingCycle()

    expect(player.pauseVideo).toHaveBeenCalled()
    expect(activeHowl.play).not.toHaveBeenCalled()

    await act(async () => {
      activeHowl.setState('loaded')
      activeHowl.trigger('load')
    })

    await advanceClipStartDelay()

    expect(activeHowl.play).toHaveBeenCalled()
  })

  it('resumes the video if an extended clip fails to load', async () => {
    await renderVideoPage([makeClip()])
    const player = makePlayer()

    await startPlaybackAt(player, 5)
    const activeHowl = getLatestHowl()
    activeHowl.setState('loading')

    await advancePollingCycle()

    await act(async () => {
      activeHowl.trigger('loaderror')
    })

    expect(player.pauseVideo).toHaveBeenCalled()
    expect(player.playVideo).toHaveBeenCalled()
  })

  it('resumes the video if an extended clip fails to play', async () => {
    await renderVideoPage([makeClip()])
    const player = makePlayer()

    await startPlaybackAt(player, 5)
    const activeHowl = getLatestHowl()

    await advancePollingCycle()
    await advanceClipStartDelay()

    await act(async () => {
      activeHowl.trigger('playerror')
    })

    expect(player.pauseVideo).toHaveBeenCalled()
    expect(activeHowl.play).toHaveBeenCalled()
    expect(player.playVideo).toHaveBeenCalled()
  })

  it('keeps inline playback on the video track without pausing YouTube', async () => {
    await renderVideoPage([
      makeClip({
        _id: 'clip-inline-1',
        file_name: 'clip-inline-1.wav',
        playback_type: 'inline',
      }),
    ])
    const player = makePlayer()

    await startPlaybackAt(player, 5)
    const activeHowl = getLatestHowl()

    await advancePollingCycle()
    await advanceClipStartDelay()

    expect(activeHowl.play).toHaveBeenCalled()
    expect(player.pauseVideo).not.toHaveBeenCalled()
    expect(player.playVideo).not.toHaveBeenCalled()
  })
})
