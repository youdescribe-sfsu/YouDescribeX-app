import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import InsertPublish from './InsertPublish'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockNavigate = jest.fn()

jest.mock('@/assets/css/insertPublish.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/audioDesc.css', () => ({}), { virtual: true })
jest.mock('@/assets/css/editAudioDesc.css', () => ({}), { virtual: true })

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('../../../shared/components/Modal/Modal', () => ({
  __esModule: true,
  default: () => <div data-testid="publish-modal" />,
}))

type Props = React.ComponentProps<typeof InsertPublish>

const buildProps = (overrides: Partial<Props> = {}): Props => ({
  handleClicksFromParent: '',
  setHandleClicksFromParent: jest.fn(),
  seconds: 0,
  reset: jest.fn(),
  setShowSpinner: jest.fn(),
  userId: 'user-1',
  youtubeVideoId: 'youtube-1',
  currentTime: 12.5,
  videoLength: 120,
  audioDescriptionId: 'ad-1',
  participantId: 'participant-1',
  setNeedRefresh: jest.fn(),
  ...overrides,
})

const readStartTimeInputs = () =>
  screen
    .getAllByRole('spinbutton')
    .map((input) => Number((input as HTMLInputElement).value))

describe('InsertPublish PR2 insert-time behavior', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset()
    mockNavigate.mockReset()
    mockedAxios.post.mockResolvedValue({ data: 'saved' })
  })

  it.each([
    ['inline', /insert inline audio clip/i],
    ['extended', /insert extended audio clip/i],
  ])(
    'snapshots the current timeline time when parent triggers %s open',
    async (trigger, heading) => {
      const setHandleClicksFromParent = jest.fn()
      const initialProps = buildProps({
        currentTime: 33.21,
        handleClicksFromParent: trigger,
        setHandleClicksFromParent,
      })
      const { rerender } = render(<InsertPublish {...initialProps} />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: heading }),
        ).toBeInTheDocument()
      })

      expect(setHandleClicksFromParent).toHaveBeenCalledWith('')
      expect(readStartTimeInputs()).toEqual([0, 0, 33, 21])

      rerender(
        <InsertPublish
          {...buildProps({
            ...initialProps,
            currentTime: 77.89,
            handleClicksFromParent: '',
            setHandleClicksFromParent,
          })}
        />,
      )

      expect(readStartTimeInputs()).toEqual([0, 0, 33, 21])
    },
  )

  it('snapshots the current timeline time on insert-open and does not drift while the dialog stays open', async () => {
    const setHandleClicksFromParent = jest.fn()
    const initialProps = buildProps({
      currentTime: 12.5,
      handleClicksFromParent: 'inline',
      setHandleClicksFromParent,
    })
    const { rerender } = render(<InsertPublish {...initialProps} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /insert inline audio clip/i }),
      ).toBeInTheDocument(),
    )

    expect(readStartTimeInputs()).toEqual([0, 0, 12, 50])

    rerender(
      <InsertPublish
        {...buildProps({
          ...initialProps,
          currentTime: 48.75,
          handleClicksFromParent: '',
          setHandleClicksFromParent,
        })}
      />,
    )

    expect(readStartTimeInputs()).toEqual([0, 0, 12, 50])
  })

  it('preserves a user-edited Start Time and submits that value on save', async () => {
    const setHandleClicksFromParent = jest.fn()
    const initialProps = buildProps({
      currentTime: 12.5,
      handleClicksFromParent: 'inline',
      setHandleClicksFromParent,
    })
    const { rerender } = render(<InsertPublish {...initialProps} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /insert inline audio clip/i }),
      ).toBeInTheDocument(),
    )

    const [hours, minutes, seconds, centiseconds] =
      screen.getAllByRole('spinbutton')

    fireEvent.change(hours, { target: { value: '0' } })
    fireEvent.change(minutes, { target: { value: '1' } })
    fireEvent.change(seconds, { target: { value: '2' } })
    fireEvent.change(centiseconds, { target: { value: '3' } })

    fireEvent.change(screen.getByPlaceholderText(/title goes here/i), {
      target: { value: 'Inserted clip' },
    })
    fireEvent.change(
      screen.getByPlaceholderText(/start writing a text description/i),
      {
        target: { value: 'This is a saved clip description.' },
      },
    )

    rerender(
      <InsertPublish
        {...buildProps({
          ...initialProps,
          currentTime: 99.99,
          handleClicksFromParent: '',
        })}
      />,
    )

    expect(readStartTimeInputs()).toEqual([0, 1, 2, 3])

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    })

    const formData = mockedAxios.post.mock.calls[0][1] as FormData

    expect(formData.get('newACTitle')).toBe('Inserted clip')
    expect(formData.get('newACStartTime')).toBe('62.03')
  })
})
